#!/bin/bash
# Builds all Docker images and pushes them to ECR.
# Run from the repository root: ./scripts/build_and_push.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Authenticating with ECR (${ECR_BASE})..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_BASE}"

echo ""
echo "Building and pushing Frontend..."
docker build -t "${ECR_BASE}/ayd-frontend:latest" "${ROOT_DIR}/frontend/"
docker push "${ECR_BASE}/ayd-frontend:latest"

echo ""
echo "Building and pushing Medical Services..."
docker build -t "${ECR_BASE}/ayd-medical-services:latest" "${ROOT_DIR}/backend/medical-services/"
docker push "${ECR_BASE}/ayd-medical-services:latest"

echo ""
echo "Building and pushing Specialties..."
docker build -t "${ECR_BASE}/ayd-specialties:latest" "${ROOT_DIR}/backend/specialties/"
docker push "${ECR_BASE}/ayd-specialties:latest"

echo ""
echo "All images pushed to ECR successfully."
