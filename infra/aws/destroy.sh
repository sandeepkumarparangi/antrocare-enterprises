#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-antrocare-prod}"
PROJECT_NAME="${PROJECT_NAME:-antrocare}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-prod}"

echo "This will delete the CloudFormation stack '$STACK_NAME' in '$REGION'."
echo "RDS is configured with snapshot-on-delete, so AWS may keep a final DB snapshot."
read -r -p "Type DELETE to continue: " answer
if [ "$answer" != "DELETE" ]; then
  echo "Cancelled."
  exit 0
fi

aws cloudformation delete-stack --region "$REGION" --stack-name "$STACK_NAME"
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name "$STACK_NAME"

aws ssm delete-parameter --region "$REGION" --name "/${PROJECT_NAME}/${ENVIRONMENT_NAME}/db-password" >/dev/null 2>&1 || true
aws ssm delete-parameter --region "$REGION" --name "/${PROJECT_NAME}/${ENVIRONMENT_NAME}/admin-key" >/dev/null 2>&1 || true

echo "Deleted $STACK_NAME. Local secrets remain under $ROOT_DIR/infra/aws/.secrets."
