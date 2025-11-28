# CloudKeep

CloudKeep is a lightweight, scalable cloud storage solution that allows users to securely upload, store, and access their files from anywhere. Designed to be a modern alternative to services like Dropbox, CloudKeep emphasizes simplicity, data privacy, and extensibility.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Features

- **Secure File Storage**: Upload files to AWS S3 with encryption
- **File Management**: List, download, delete, and share files
- **User Authentication**: Token-based authorization
- **Serverless Architecture**: Scalable AWS Lambda functions
- **Modern UI**: React-based responsive interface
- **RESTful API**: Well-documented API endpoints
- **Docker Support**: Containerized deployment option

## Architecture

**Backend:**
- Node.js 18 with Express
- AWS Lambda for serverless functions
- AWS S3 for file storage
- DynamoDB for metadata storage
- Serverless Framework for deployment

**Frontend:**
- React 18
- Modern responsive design
- Nginx for production serving

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Docker** (optional, for containerized deployment) - [Download](https://www.docker.com/)
- **AWS Account** (for deployment) - [Sign up](https://aws.amazon.com/)
- **AWS CLI** (for deployment) - [Install Guide](https://aws.amazon.com/cli/)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AbgaryanNver/cloudkeep.git
cd cloudkeep
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## Running Locally

### Backend

#### Option 1: Using Express Server (Recommended for Development)

```bash
cd backend

# Set environment variables (create .env file)
cat > .env << EOF
PORT=3000
BUCKET_NAME=cloudkeep-files-dev
DYNAMODB_TABLE=cloudkeep-metadata-dev
AWS_REGION=us-east-1
EOF

# Start the server
npm start
```

The backend API will be available at `http://localhost:3000`

#### Option 2: Using Serverless Offline

```bash
cd backend

# Install serverless globally (if not already installed)
npm install -g serverless

# Start serverless offline
npm run local
```

The API will be available at `http://localhost:3000`

### Frontend

```bash
cd frontend

# Create .env file (optional)
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000
EOF

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000` (or `http://localhost:3001` if backend is running on 3000)

### Testing the Application

1. Open your browser to `http://localhost:3000` (frontend)
2. Click "Upload File" to upload a file
3. View your uploaded files in the list
4. Click the delete button to remove files

**Note:** For local development without AWS, you'll need to set up LocalStack or mock AWS services.

## Running with Docker

### Build and Run Backend

```bash
cd backend

# Build the Docker image
docker build -t cloudkeep-backend .

# Run the container
docker run -p 3000:3000 \
  -e BUCKET_NAME=cloudkeep-files-dev \
  -e DYNAMODB_TABLE=cloudkeep-metadata-dev \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your_access_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret_key \
  cloudkeep-backend
```

### Build and Run Frontend

```bash
cd frontend

# Build the Docker image
docker build -t cloudkeep-frontend .

# Run the container
docker run -p 80:80 cloudkeep-frontend
```

### Using Docker Compose (Recommended)

Create a `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - BUCKET_NAME=cloudkeep-files-dev
      - DYNAMODB_TABLE=cloudkeep-metadata-dev
      - AWS_REGION=us-east-1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Then run:

```bash
docker-compose up -d
```

## Testing

### Backend Tests

```bash
cd backend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run all tests (non-watch mode)
npm test -- --watchAll=false
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## Deployment

CloudKeep uses **Terraform** for infrastructure provisioning and **Serverless Framework** for Lambda deployment. This section provides complete step-by-step instructions.

### AWS Infrastructure Setup (Terraform)

#### Prerequisites

1. **Terraform** (>= 1.0)
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **AWS CLI** configured with credentials
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Default region: us-east-1
   # Default output format: json
   ```

#### Step 1: Create Terraform State Backend

Before deploying infrastructure, create S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://cloudkeep-terraform-state --region us-east-1

# Enable versioning on state bucket
aws s3api put-bucket-versioning \
  --bucket cloudkeep-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket cloudkeep-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

#### Step 2: Initialize Terraform

```bash
cd terraform
terraform init
```

Expected output:
```
Initializing modules...
Initializing the backend...
Terraform has been successfully initialized!
```

#### Step 3: Review Infrastructure Plan

```bash
# Development environment
terraform plan -var-file=environments/dev/terraform.tfvars

# Staging environment
terraform plan -var-file=environments/staging/terraform.tfvars

# Production environment
terraform plan -var-file=environments/prod/terraform.tfvars
```

This will show you all resources that will be created:
- VPC with public/private subnets
- NAT Gateways
- Security Groups
- Cognito User Pool
- S3 Bucket
- DynamoDB Table
- ElastiCache Cluster
- Application Load Balancer
- API Gateway

#### Step 4: Deploy Infrastructure

```bash
# Deploy development infrastructure
terraform apply -var-file=environments/dev/terraform.tfvars

# Type 'yes' when prompted to confirm
```

Deployment takes approximately **10-15 minutes**. Resources created:
- ✅ VPC across 3 availability zones
- ✅ 3 NAT Gateways
- ✅ Cognito User Pool
- ✅ S3 bucket with encryption
- ✅ DynamoDB table
- ✅ ElastiCache Redis cluster
- ✅ Application Load Balancer
- ✅ Security Groups
- ✅ VPC Endpoints

#### Step 5: Save Terraform Outputs

```bash
# View all outputs
terraform output

# Save to file for reference
terraform output -json > terraform-outputs.json

# Get specific values
terraform output cognito_user_pool_id
terraform output cognito_user_pool_client_id
terraform output s3_bucket_name
terraform output dynamodb_table_name
terraform output api_gateway_url
terraform output elasticache_endpoint
terraform output alb_dns_name
```

**Important**: Save these values - you'll need them for backend and frontend configuration.

### Backend Deployment (Serverless Framework)

#### Step 1: Configure Backend Environment

Create `backend/.env` file with Terraform outputs:

```bash
cd ../backend

cat > .env << EOF
# AWS Configuration
AWS_REGION=us-east-1
NODE_ENV=production

# From Terraform outputs
USER_POOL_ID=$(cd ../terraform && terraform output -raw cognito_user_pool_id)
USER_POOL_CLIENT_ID=$(cd ../terraform && terraform output -raw cognito_user_pool_client_id)
BUCKET_NAME=$(cd ../terraform && terraform output -raw s3_bucket_name)
DYNAMODB_TABLE=$(cd ../terraform && terraform output -raw dynamodb_table_name)
ELASTICACHE_ENDPOINT=$(cd ../terraform && terraform output -raw elasticache_endpoint)
EOF
```

#### Step 2: Update Serverless Configuration

The `serverless.yml` should reference the Terraform-created resources:

```yaml
# This configuration is already set up in backend/serverless.yml
# Verify it matches your Terraform outputs
```

#### Step 3: Install Serverless Framework

```bash
npm install -g serverless
```

#### Step 4: Deploy Lambda Functions

```bash
# Deploy to development
serverless deploy --stage dev --region us-east-1

# Deploy to staging
serverless deploy --stage staging --region us-east-1

# Deploy to production
serverless deploy --stage production --region us-east-1
```

Deployment creates:
- ✅ 6 Lambda functions (upload, download, list, delete, share, authorizer)
- ✅ API Gateway endpoints
- ✅ Lambda execution roles
- ✅ CloudWatch log groups

#### Step 5: Test Backend API

```bash
# Get API endpoint from deployment output
API_URL="<your-api-gateway-url>"

# Test health endpoint
curl $API_URL/health

# Expected response:
# {"status":"healthy","service":"cloudkeep-backend","timestamp":"..."}
```

### Frontend Deployment

#### Step 1: Configure Frontend

Create `frontend/src/aws-config.js`:

```bash
cd ../frontend

cat > src/aws-config.js << 'EOF'
const awsconfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    }
  },
  API: {
    endpoints: [
      {
        name: 'CloudKeepAPI',
        endpoint: process.env.REACT_APP_API_URL,
        region: 'us-east-1'
      }
    ]
  }
};

export default awsconfig;
EOF
```

#### Step 2: Create Environment File

```bash
# Get values from Terraform
cd ../terraform

cat > ../frontend/.env.production << EOF
REACT_APP_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
REACT_APP_USER_POOL_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
REACT_APP_API_URL=$(cd ../backend && serverless info --stage production | grep "endpoint:" | awk '{print $2}')
REACT_APP_STAGE=production
EOF
```

#### Step 3: Build Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build
```

#### Step 4: Deploy to S3

```bash
# Get S3 bucket name from Terraform
S3_BUCKET=$(cd ../terraform && terraform output -raw s3_bucket_name)

# Sync build to S3
aws s3 sync build/ s3://$S3_BUCKET --delete

# Set proper content types
aws s3 cp s3://$S3_BUCKET s3://$S3_BUCKET \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --metadata-directive REPLACE

# Configure bucket for static website hosting
aws s3 website s3://$S3_BUCKET \
  --index-document index.html \
  --error-document index.html
```

#### Step 5: Access Application

```bash
# Get ALB DNS name
ALB_DNS=$(cd ../terraform && terraform output -raw alb_dns_name)

echo "Application URL: http://$ALB_DNS"
```

### Post-Deployment Configuration

#### Configure Cognito

1. **Create Test User**:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id <USER_POOL_ID> \
     --username testuser@example.com \
     --user-attributes Name=email,Value=testuser@example.com \
     --temporary-password TempPass123!
   ```

2. **Confirm User** (for testing):
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id <USER_POOL_ID> \
     --username testuser@example.com \
     --password MyNewPass123! \
     --permanent
   ```

#### Configure Custom Domain (Optional)

1. **Request ACM Certificate**:
   ```bash
   aws acm request-certificate \
     --domain-name cloudkeep.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Update Terraform** with certificate ARN:
   ```hcl
   # In terraform/environments/prod/terraform.tfvars
   acm_certificate_arn = "arn:aws:acm:us-east-1:..."
   ```

3. **Re-apply Terraform**:
   ```bash
   terraform apply -var-file=environments/prod/terraform.tfvars
   ```

4. **Create Route53 Record**:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id <YOUR_ZONE_ID> \
     --change-batch file://dns-record.json
   ```

### Automated Deployment with GitHub Actions

The project includes CI/CD workflows:

#### Build Workflow (`.github/workflows/build.yml`)
Runs on every push/PR:
- ✅ Builds and tests backend and frontend
- ✅ Creates Docker images
- ✅ Runs security scans
- ✅ Linting and code quality checks

#### Deploy Workflow (`.github/workflows/deploy.yml`)
Runs on main/develop branches:
- ✅ Deploys backend to AWS Lambda
- ✅ Deploys frontend to S3
- ✅ Publishes Docker images
- ✅ Invalidates CloudFront cache

#### Required GitHub Secrets

Configure these in your repository settings (Settings → Secrets → Actions):

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>

# Docker Hub (for Docker image publishing)
DOCKER_USERNAME=<your-docker-username>
DOCKER_PASSWORD=<your-docker-password>

# CloudFront (if using)
CLOUDFRONT_DISTRIBUTION_ID=<your-distribution-id>

# Cognito (from Terraform outputs)
USER_POOL_ID=<from-terraform>
USER_POOL_CLIENT_ID=<from-terraform>
```

### Monitoring and Logs

#### View Lambda Logs

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/cloudkeep

# Tail logs for upload function
serverless logs -f uploadFile --tail --stage production

# View last 100 lines
serverless logs -f uploadFile --tail --stage production --startTime 1h
```

#### View API Gateway Logs

```bash
# Enable API Gateway logging (one-time setup)
aws apigateway update-stage \
  --rest-api-id <API_ID> \
  --stage-name production \
  --patch-operations op=replace,path=/accessLogSettings/destinationArn,value=<LOG_ARN>
```

#### CloudWatch Dashboard

Create a dashboard to monitor:
- Lambda invocations and errors
- API Gateway requests and latency
- S3 bucket operations
- DynamoDB read/write capacity
- ElastiCache hit/miss ratio

### Cost Estimation

**Monthly costs for development environment:**

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| VPC & NAT Gateway | 1 NAT (dev) | ~$32 |
| ElastiCache | t3.micro | ~$12 |
| S3 | 10 GB storage | ~$0.23 |
| DynamoDB | On-demand, low traffic | ~$1-5 |
| Lambda | 1M requests | ~$0.20 |
| API Gateway | 1M requests | ~$3.50 |
| CloudWatch Logs | 5 GB | ~$2.50 |
| **Total** | | **~$51/month** |

**Production environment** (3 NAT Gateways, larger ElastiCache): **~$150-200/month**

**Cost optimization tips:**
- Use single NAT Gateway for dev
- Use t3.micro for ElastiCache in dev
- Enable S3 lifecycle policies
- Use DynamoDB on-demand billing
- Set CloudWatch log retention to 7 days for dev

## API Documentation

### Authentication

All endpoints (except health check) require a Bearer token:

```
Authorization: Bearer cloudkeep-{userId}
```

For development, you can also use the `x-user-id` header:

```
x-user-id: demo-user
```

### Endpoints

#### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "cloudkeep-backend",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Upload File

```http
POST /upload
Content-Type: application/json
Authorization: Bearer cloudkeep-{userId}

{
  "fileName": "document.pdf",
  "fileContent": "base64_encoded_content",
  "contentType": "application/pdf",
  "fileSize": 12345
}
```

Response:
```json
{
  "message": "File uploaded successfully",
  "fileId": "uuid",
  "fileName": "document.pdf",
  "uploadDate": 1234567890
}
```

#### List Files

```http
GET /files?limit=50&lastKey=encoded_key
Authorization: Bearer cloudkeep-{userId}
```

Response:
```json
{
  "files": [
    {
      "fileId": "uuid",
      "fileName": "document.pdf",
      "fileSize": 12345,
      "contentType": "application/pdf",
      "uploadDate": 1234567890,
      "shared": false
    }
  ],
  "count": 1,
  "lastKey": "encoded_key_for_pagination"
}
```

#### Download File

```http
GET /download/{fileId}
Authorization: Bearer cloudkeep-{userId}
```

Response:
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "fileName": "document.pdf",
  "fileSize": 12345,
  "contentType": "application/pdf",
  "expiresIn": 3600
}
```

#### Delete File

```http
DELETE /files/{fileId}
Authorization: Bearer cloudkeep-{userId}
```

Response:
```json
{
  "message": "File deleted successfully",
  "fileId": "uuid",
  "fileName": "document.pdf"
}
```

#### Share File

```http
POST /share/{fileId}
Content-Type: application/json
Authorization: Bearer cloudkeep-{userId}

{
  "expiresIn": 86400
}
```

Response:
```json
{
  "message": "Share link generated successfully",
  "shareUrl": "https://s3.amazonaws.com/...",
  "fileName": "document.pdf",
  "expiresIn": 86400,
  "expiresAt": 1234567890000
}
```

## Environment Variables

### Backend

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `BUCKET_NAME` | S3 bucket name | - | Yes |
| `DYNAMODB_TABLE` | DynamoDB table name | - | Yes |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | Yes (for deployment) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | Yes (for deployment) |

### Frontend

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3000` | No |
| `REACT_APP_STAGE` | Environment stage | `development` | No |

## Project Structure

```
cloudkeep/
├── backend/
│   ├── handlers/              # Lambda function handlers
│   │   ├── upload.js          # File upload handler
│   │   ├── download.js        # File download handler
│   │   ├── list.js            # List files handler
│   │   ├── delete.js          # Delete file handler
│   │   ├── share.js           # Share file handler
│   │   └── authorizer.js      # API authorizer
│   ├── __tests__/             # Test files
│   │   └── handlers.test.js   # Handler tests
│   ├── index.js               # Express server for Docker
│   ├── package.json           # Dependencies and scripts
│   ├── serverless.yml         # Serverless configuration
│   ├── Dockerfile             # Docker configuration
│   └── .gitignore             # Git ignore patterns
├── frontend/
│   ├── public/                # Static files
│   │   └── index.html         # HTML template
│   ├── src/                   # React source code
│   │   ├── App.js             # Main application component
│   │   ├── App.css            # Application styles
│   │   ├── App.test.js        # Component tests
│   │   ├── index.js           # React entry point
│   │   ├── index.css          # Global styles
│   │   └── setupTests.js      # Test configuration
│   ├── package.json           # Dependencies and scripts
│   ├── nginx.conf             # Nginx configuration
│   ├── Dockerfile             # Docker configuration
│   └── .gitignore             # Git ignore patterns
├── .github/
│   └── workflows/             # GitHub Actions workflows
│       ├── build.yml          # Build and test workflow
│       └── deploy.yml         # Deployment workflow
└── README.md                  # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/AbgaryanNver/cloudkeep/issues)
- Check existing documentation

---

**CloudKeep** - Secure, Simple, Scalable Cloud Storage
