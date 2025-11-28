# CloudKeep Terraform Infrastructure

This directory contains Terraform configurations for deploying CloudKeep infrastructure on AWS with best practices.

## Architecture Components

- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **NAT Gateways**: For outbound internet access from private subnets
- **AWS Cognito**: User authentication and authorization
- **API Gateway**: RESTful API management with Cognito authorizer
- **Lambda**: Serverless compute for backend functions
- **S3**: Encrypted file storage with versioning
- **DynamoDB**: Metadata storage with point-in-time recovery
- **ElastiCache**: Redis cluster for caching
- **Application Load Balancer**: HTTPS load balancing (optional)
- **Security Groups**: Network security controls
- **VPC Endpoints**: Private connections to AWS services

## Directory Structure

```
terraform/
├── main.tf                 # Main configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── modules/                # Reusable modules
│   ├── vpc/               # VPC and networking
│   ├── cognito/           # User authentication
│   ├── security/          # Security groups
│   ├── s3/                # File storage
│   ├── dynamodb/          # Metadata database
│   ├── elasticache/       # Redis caching
│   ├── lambda/            # Lambda functions
│   ├── api-gateway/       # API management
│   └── alb/               # Load balancer
└── environments/          # Environment-specific configs
    ├── dev/
    ├── staging/
    └── prod/
```

## Prerequisites

1. **Terraform**: >= 1.0
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

2. **AWS CLI**: Configured with appropriate credentials
   ```bash
   aws configure
   ```

3. **S3 Backend Bucket**: Create manually before first run
   ```bash
   aws s3 mb s3://cloudkeep-terraform-state --region us-east-1
   aws s3api put-bucket-versioning \
     --bucket cloudkeep-terraform-state \
     --versioning-configuration Status=Enabled
   ```

4. **DynamoDB State Lock Table**:
   ```bash
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

## Usage

### Initialize Terraform

```bash
cd terraform
terraform init
```

### Plan Deployment

```bash
# Development
terraform plan -var-file=environments/dev/terraform.tfvars

# Staging
terraform plan -var-file=environments/staging/terraform.tfvars

# Production
terraform plan -var-file=environments/prod/terraform.tfvars
```

### Apply Configuration

```bash
# Development
terraform apply -var-file=environments/dev/terraform.tfvars

# With auto-approve (use cautiously)
terraform apply -var-file=environments/dev/terraform.tfvars -auto-approve
```

### Destroy Infrastructure

```bash
terraform destroy -var-file=environments/dev/terraform.tfvars
```

## Environment Configuration

Each environment has its own `terraform.tfvars` file in `environments/{env}/`:

- `dev`: Development environment (minimal resources)
- `staging`: Staging environment (production-like)
- `prod`: Production environment (high availability)

## Outputs

After successful deployment, Terraform outputs:

- VPC ID
- Cognito User Pool details
- API Gateway URL
- S3 Bucket name
- DynamoDB Table name
- ElastiCache endpoint
- ALB DNS name

View outputs:
```bash
terraform output
```

## Security Best Practices

1. **Network Isolation**: Lambda functions in private subnets
2. **Encryption**: S3 and DynamoDB encrypted at rest
3. **HTTPS**: ALB with SSL/TLS certificates
4. **Least Privilege**: IAM roles with minimal permissions
5. **VPC Endpoints**: Private access to AWS services
6. **Security Groups**: Restrictive inbound/outbound rules
7. **Secrets Management**: Use AWS Secrets Manager (not in this config)

## Cost Optimization

- ElastiCache: t3.micro for dev, scale up for production
- NAT Gateways: 3 AZs for HA (reduce for dev)
- S3: Lifecycle policies for old versions
- DynamoDB: Pay-per-request billing

## Troubleshooting

### State Lock Error

```bash
# Force unlock (use cautiously)
terraform force-unlock <LOCK_ID>
```

### Resource Already Exists

```bash
# Import existing resource
terraform import aws_s3_bucket.files <bucket-name>
```

### Permission Denied

Ensure AWS credentials have sufficient permissions:
- VPC, EC2, S3, DynamoDB, Lambda, API Gateway, Cognito, ElastiCache, IAM

## Integration with Serverless

The Terraform configuration creates the infrastructure, while Serverless Framework deploys the Lambda functions. Update `backend/serverless.yml` with Terraform outputs:

```yaml
provider:
  vpc:
    securityGroupIds:
      - ${terraform output lambda_sg_id}
    subnetIds:
      - ${terraform output private_subnet_ids}
```

## Maintenance

### State Management

- State is stored in S3 with encryption
- State locking via DynamoDB prevents concurrent modifications
- Enable versioning on state bucket

### Updates

```bash
# Update modules
terraform get -update

# Upgrade provider versions
terraform init -upgrade
```

## Contributing

When adding new resources:
1. Use modules for reusability
2. Add appropriate tags
3. Follow naming conventions
4. Document in this README
5. Test in dev before production

## Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)