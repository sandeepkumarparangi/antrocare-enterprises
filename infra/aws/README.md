# Antrocare AWS Deployment

This deploys Antrocare to AWS in `us-east-1` by default with a free-tier-conscious setup:

- VPC across two Availability Zones
- Public subnets for the load balancer and single app server
- Private DB subnets for PostgreSQL RDS
- EC2 `t3.micro` running the Spring Boot jar
- RDS PostgreSQL `db.t3.micro`, 20 GB encrypted storage
- Application Load Balancer
- HTTP API Gateway in front of the load balancer
- SSM Parameter Store for the database password and admin key
- CloudWatch log collection
- Optional AWS Budget email alert

The template intentionally avoids NAT Gateway because it is usually not free-tier friendly.

## Deploy

First refresh AWS CLI login, then run:

```bash
AWS_REGION=us-east-1 BUDGET_AMOUNT=5 BUDGET_EMAIL=you@example.com ./infra/aws/deploy.sh
```

If `BUDGET_EMAIL` is omitted, the deployment still works but budget email notifications are skipped.
`ADMIN_EMAIL` defaults to `BUDGET_EMAIL` and is passed to the app for inventory alerts.

After deployment, use the `ApiGatewayUrl` output for the global URL. The direct ALB URL is also shown, but without a domain name the API Gateway URL is the HTTPS entry point.

Low-stock alerts are always shown in the admin dashboard. Email sending is disabled by default until SMTP settings are configured for the Spring Boot app.

## Admin Key

The deploy script generates and stores the admin key locally in:

```bash
infra/aws/.secrets/antrocare-prod.env
```

You can also retrieve it from AWS:

```bash
aws ssm get-parameter --region us-east-1 --name /antrocare/prod/admin-key --with-decryption --query Parameter.Value --output text
```

## Update The App

After changing code, rerun:

```bash
AWS_REGION=us-east-1 ./infra/aws/deploy.sh
```

The script rebuilds the frontend, packages the Spring Boot jar, uploads it to a private S3 artifact bucket, and updates the CloudFormation stack.

## Delete

```bash
AWS_REGION=us-east-1 ./infra/aws/destroy.sh
```

RDS uses snapshot-on-delete, so AWS may keep a final DB snapshot after stack deletion. Delete snapshots manually if you do not want to keep them.
