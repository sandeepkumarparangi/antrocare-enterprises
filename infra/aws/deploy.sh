#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AWS_DIR="$ROOT_DIR/infra/aws"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-antrocare-prod}"
PROJECT_NAME="${PROJECT_NAME:-antrocare}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-prod}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
BUDGET_AMOUNT="${BUDGET_AMOUNT:-5}"
BUDGET_EMAIL="${BUDGET_EMAIL:-}"
DB_PASSWORD_PARAMETER="/${PROJECT_NAME}/${ENVIRONMENT_NAME}/db-password"
ADMIN_KEY_PARAMETER="/${PROJECT_NAME}/${ENVIRONMENT_NAME}/admin-key"
SECRETS_DIR="$AWS_DIR/.secrets"
SECRETS_FILE="$SECRETS_DIR/${STACK_NAME}.env"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

rand_alnum() {
  local value
  value="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1" || true)"
  printf "%s" "$value"
}

create_bucket_if_needed() {
  local bucket="$1"
  if aws s3api head-bucket --bucket "$bucket" --region "$REGION" >/dev/null 2>&1; then
    return
  fi

  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$bucket" --region "$REGION" >/dev/null
  else
    aws s3api create-bucket \
      --bucket "$bucket" \
      --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=$REGION" >/dev/null
  fi

  aws s3api put-public-access-block \
    --bucket "$bucket" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
    --region "$REGION"

  aws s3api put-bucket-encryption \
    --bucket "$bucket" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' \
    --region "$REGION"
}

upsert_budget() {
  local account_id="$1"
  if [ -z "$BUDGET_EMAIL" ]; then
    echo "Skipping AWS Budget notification because BUDGET_EMAIL is empty."
    return
  fi

  local tmp_dir="$2"
  local budget_name="${STACK_NAME}-monthly-${BUDGET_AMOUNT}-usd"
  local budget_file="$tmp_dir/budget.json"
  local notification_file="$tmp_dir/budget-notification.json"
  local subscriber_file="$tmp_dir/budget-subscriber.json"

  cat > "$budget_file" <<JSON
{
  "BudgetName": "$budget_name",
  "BudgetLimit": {
    "Amount": "$BUDGET_AMOUNT",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostTypes": {
    "IncludeTax": true,
    "IncludeSubscription": true,
    "UseBlended": false,
    "IncludeRefund": false,
    "IncludeCredit": false,
    "IncludeUpfront": true,
    "IncludeRecurring": true,
    "IncludeOtherSubscription": true,
    "IncludeSupport": true,
    "IncludeDiscount": true,
    "UseAmortized": false
  }
}
JSON

  cat > "$notification_file" <<JSON
{
  "NotificationType": "ACTUAL",
  "ComparisonOperator": "GREATER_THAN",
  "Threshold": 80,
  "ThresholdType": "PERCENTAGE"
}
JSON

  cat > "$subscriber_file" <<JSON
[
  {
    "SubscriptionType": "EMAIL",
    "Address": "$BUDGET_EMAIL"
  }
]
JSON

  if aws budgets describe-budget --account-id "$account_id" --budget-name "$budget_name" --region us-east-1 >/dev/null 2>&1; then
    aws budgets update-budget --account-id "$account_id" --new-budget "file://$budget_file" --region us-east-1
  else
    aws budgets create-budget --account-id "$account_id" --budget "file://$budget_file" --region us-east-1
  fi

  aws budgets create-notification \
    --account-id "$account_id" \
    --budget-name "$budget_name" \
    --notification "file://$notification_file" \
    --subscribers "file://$subscriber_file" \
    --region us-east-1 >/dev/null 2>&1 || true

  echo "Budget guard set: $budget_name at \$$BUDGET_AMOUNT, email alert at 80% to $BUDGET_EMAIL."
}

need aws
need npm
need rsync
need ./mvnw

cd "$ROOT_DIR"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"
ARTIFACT_BUCKET="${ARTIFACT_BUCKET:-antrocare-artifacts-${ACCOUNT_ID}-${REGION}}"
ARTIFACT_KEY="${ARTIFACT_KEY:-${STACK_NAME}/antrocare-enterprises.jar}"

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"
if [ ! -f "$SECRETS_FILE" ]; then
  {
    echo "DB_PASSWORD=$(rand_alnum 32)"
    echo "ADMIN_KEY=Antrocare-$(rand_alnum 24)"
  } > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
fi

# shellcheck disable=SC1090
source "$SECRETS_FILE"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
BUILD_DIR="$TMP_DIR/source"

rsync -a \
  --exclude ".git" \
  --exclude "target" \
  --exclude "frontend/node_modules" \
  --exclude "frontend/dist" \
  --exclude "infra/aws/.secrets" \
  "$ROOT_DIR/" "$BUILD_DIR/"

echo "Building frontend..."
(cd "$BUILD_DIR/frontend" && npm ci && npm run build)

echo "Packaging Spring Boot jar..."
mkdir -p "$BUILD_DIR/src/main/resources/static"
rsync -a "$BUILD_DIR/frontend/dist/" "$BUILD_DIR/src/main/resources/static/"
(cd "$BUILD_DIR" && ./mvnw -q -DskipTests package)

create_bucket_if_needed "$ARTIFACT_BUCKET"
aws s3 cp "$BUILD_DIR/target/antrocare-enterprises-0.0.1-SNAPSHOT.jar" "s3://$ARTIFACT_BUCKET/$ARTIFACT_KEY" --sse AES256 --region "$REGION"

aws ssm put-parameter \
  --name "$DB_PASSWORD_PARAMETER" \
  --type SecureString \
  --value "$DB_PASSWORD" \
  --overwrite \
  --region "$REGION" >/dev/null

aws ssm put-parameter \
  --name "$ADMIN_KEY_PARAMETER" \
  --type SecureString \
  --value "$ADMIN_KEY" \
  --overwrite \
  --region "$REGION" >/dev/null

upsert_budget "$ACCOUNT_ID" "$TMP_DIR"

echo "Deploying CloudFormation stack $STACK_NAME in $REGION..."
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$AWS_DIR/cloudformation.yml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName="$PROJECT_NAME" \
    EnvironmentName="$ENVIRONMENT_NAME" \
    InstanceType="$INSTANCE_TYPE" \
    AppArtifactBucket="$ARTIFACT_BUCKET" \
    AppArtifactKey="$ARTIFACT_KEY" \
    DbPasswordParameterName="$DB_PASSWORD_PARAMETER" \
    AdminKeyParameterName="$ADMIN_KEY_PARAMETER"

echo
echo "Deployment outputs:"
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[].{Name:OutputKey,Value:OutputValue}' \
  --output table

echo
echo "Local admin key is saved in: $SECRETS_FILE"
echo "AWS admin key command:"
echo "aws ssm get-parameter --region $REGION --name $ADMIN_KEY_PARAMETER --with-decryption --query Parameter.Value --output text"
