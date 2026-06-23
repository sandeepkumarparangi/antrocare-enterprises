# CI/CD Pipeline for Antrocare Enterprises

This document describes the CI/CD pipeline implemented for the Antrocare Enterprises application using GitHub Actions.

## Overview

The CI/CD pipeline automates the following processes:
1. **Code Checkout** - Retrieves the latest code from the repository
2. **Dependency Management** - Caches and installs Maven/NPM dependencies
3. **Build Process** - Compiles both backend (Java/Spring Boot) and frontend (React/Vite) applications
4. **Testing** - Runs unit tests for both frontend and backend
5. **Security Scanning** - Performs vulnerability scanning on Docker images
6. **Docker Image Building** - Creates multi-architecture Docker images
7. **Image Publishing** - Pushes images to GitHub Container Registry (GHCR)
8. **Deployment** - Deploys to staging and production environments (with manual approval for production)

## Workflow File

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml`

## Features

### Supported Platforms
- **Backend**: Java 17, Spring Boot 3.x
- **Frontend**: Node.js 22, React, Vite, Tailwind CSS
- **Containerization**: Docker multi-build (linux/amd64, linux/arm64)

### CI Stages
1. **Backend Build & Test**
   - Maven dependency caching
   - Compilation and unit testing
   - Artifact validation

2. **Frontend Build & Test**
   - NPM dependency caching
   - Linting (if configured)
   - Unit testing (if configured)
   - Production build

3. **Docker Build & Push**
   - Multi-platform image building (amd64/arm64)
   - Build caching for faster subsequent builds
   - Image signing and provenance
   - Push to GHCR (GitHub Container Registry)

4. **Security Scanning**
   - Trivy vulnerability scanning
   - Integration with GitHub Code Scanning (SARIF format)

5. **Deployment**
   - Staging deployment (automatic on main branch)
   - Production deployment (requires manual approval)
   - Multiple deployment targets supported (AWS ECS, Render.com, etc.)

### Environment Variables
- `REGISTRY`: Docker registry (default: ghcr.io)
- `IMAGE_NAME`: Image repository name (defaults to GitHub repository)
- `JAVA_VERSION`: Java version for builds (17)
- `NODE_VERSION`: Node.js version for builds (22)

### Secrets Required
For full functionality, configure these repository secrets:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `AWS_ACCESS_KEY_ID`: For AWS deployments (optional)
- `AWS_SECRET_ACCESS_KEY`: For AWS deployments (optional)
- Additional secrets as needed for your deployment targets

## Customization

### Changing Docker Registry
To use Docker Hub or another registry:
1. Modify the `REGISTRY` variable in the workflow
2. Add appropriate secrets for registry authentication
3. Update the Docker login step

### Targeting Different Deployment Platforms
The workflow includes placeholder sections for:
- AWS ECS/EC2/EKS
- Render.com (your existing setup)
- Other platforms can be added by modifying the deploy steps

### Adjusting Build Resources
Modify the `timeout-minutes` values in each job if your build requires more or less time.

## Triggers

The workflow runs on:
- Push to `main` or `master` branches
- Pull requests targeting `main` or `master` branches
- Manual trigger via GitHub UI (`workflow_dispatch`)

## Monitoring and Logs

All workflow runs are visible in the **Actions** tab of your GitHub repository.
- Each job shows detailed logs
- Artifacts can be downloaded from completed workflows
- Test results and security scans are integrated where applicable

## Troubleshooting

### Common Issues

1. **Maven Build Failures**
   - Check `target/` directory for compiled classes
   - Verify Java version compatibility
   - Check network connectivity for Maven Central

2. **Node.js Build Failures**
   - Ensure `package-lock.json` is committed
   - Verify Node.js version compatibility
   - Check for missing frontend dependencies

3. **Docker Build Failures**
   - Verify Dockerfile syntax
   - Check base image availability
   - Ensure sufficient disk space for multi-platform builds

4. **Deployment Failures**
   - Validate cloud provider credentials
   - Check resource quotas and limits
   - Verify network connectivity and security groups

## Maintenance

### Updating Dependencies
- Java dependencies: Update `pom.xml` and rebuild
- Node.js dependencies: Update `package.json` in frontend/
- Docker base images: Update Dockerfile FROM statements

### Security Updates
- Regularly update GitHub Actions to latest versions
- Keep base Docker images current
- Monitor vulnerability scans and address findings

## Extending the Pipeline

### Adding Integration Tests
Add a new job after build that deploys to a temporary environment and runs integration tests.

### Adding Performance Tests
Include performance testing tools like JMeter or k6 in a separate job.

### Adding Code Quality Checks
Integrate tools like SonarQube, CodeQL, or ESLint with custom rules.

### Adding Notification Steps
Add Slack, Email, or Teams notifications for build status updates.

## License

This CI/CD configuration is part of the Antrocare Enterprises project.
