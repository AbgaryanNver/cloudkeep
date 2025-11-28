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

### Deploy Backend to AWS Lambda

```bash
cd backend

# Configure AWS credentials
aws configure

# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Deploy Frontend to AWS S3

```bash
cd frontend

# Build production bundle
npm run build

# Deploy to S3 (replace with your bucket name)
aws s3 sync build/ s3://cloudkeep-frontend-production --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Automated Deployment with GitHub Actions

The project includes CI/CD workflows:

- **Build Workflow** (`.github/workflows/build.yml`): Runs on every push/PR
  - Builds and tests backend and frontend
  - Creates Docker images
  - Runs security scans

- **Deploy Workflow** (`.github/workflows/deploy.yml`): Runs on main/develop branches
  - Deploys backend to AWS Lambda
  - Deploys frontend to S3
  - Publishes Docker images

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `CLOUDFRONT_DISTRIBUTION_ID`

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
