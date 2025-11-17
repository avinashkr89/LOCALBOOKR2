#!/bin/bash
# LocalBookr Netlify Multi-App Deployment Script
# Usage: ./deploy-netlify.sh

echo "🚀 LocalBookr Netlify Deployment Started..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Project Root
PROJECT_ROOT=$(pwd)
DEPLOY_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "Project Root: $PROJECT_ROOT"
echo "Timestamp: $DEPLOY_TIMESTAMP"

# Function to deploy app
deploy_app() {
    local app_name=$1
    local source_dir=$2
    local deploy_url=$3

    echo -e "${YELLOW}🚀 Deploying $app_name...${NC}"

    if [ -d "$source_dir/.next" ]; then
        echo "Building $app_name..."
        cd "$source_dir"
        npm run build

        echo "Deploying to Netlify..."
        netlify deploy --prod --dir=.next --site="$deploy_url" --message="Deploy $app_name - $DEPLOY_TIMESTAMP"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $app_name deployed successfully!${NC}"
        else
            echo -e "${RED}❌ $app_name deployment failed!${NC}"
        fi

        cd "$PROJECT_ROOT"
    else
        echo -e "${RED}❌ Build directory not found for $app_name${NC}"
    fi
}

# Function to deploy serverless backend
deploy_backend() {
    echo -e "${YELLOW}🚀 Deploying Backend API (Serverless)...${NC}"

    cd "$PROJECT_ROOT/netlify/functions"

    # Install dependencies
    npm install

    # Deploy serverless functions
    netlify deploy --prod --site=api-localbookr --functions-dir=. --message="Deploy Backend API - $DEPLOY_TIMESTAMP"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend API deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Backend API deployment failed!${NC}"
    fi

    cd "$PROJECT_ROOT"
}

# Menu for deployment options
echo -e "${BLUE}🎯 Choose Deployment Option:${NC}"
echo "1) Deploy Admin Dashboard"
echo "2) Deploy Customer App"
echo "3) Deploy Partner Dashboard"
echo "4) Deploy Backend API"
echo "5) Deploy All Apps"
echo "6) Quick Deploy (Recommended)"
echo "7) Exit"

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        deploy_app "Admin Dashboard" "admin-dashboard" "admin-localbookr.netlify.app"
        ;;
    2)
        deploy_app "Customer App" "frontend" "customer-localbookr.netlify.app"
        ;;
    3)
        deploy_app "Partner Dashboard" "partner-dashboard" "partner-localbookr.netlify.app"
        ;;
    4)
        deploy_backend
        ;;
    5)
        echo -e "${YELLOW}🚀 Deploying all apps...${NC}"
        deploy_app "Admin Dashboard" "admin-dashboard" "admin-localbookr.netlify.app"
        deploy_app "Customer App" "frontend" "customer-localbookr.netlify.app"
        deploy_app "Partner Dashboard" "partner-dashboard" "partner-localbookr.netlify.app"
        deploy_backend
        ;;
    6)
        echo -e "${GREEN}⚡ Quick Deploy (All Apps)${NC}"

        # Build all apps in parallel
        echo "Building all applications..."
        cd admin-dashboard && npm run build &
        cd frontend && npm run build &
        cd partner-dashboard && npm run build &
        wait

        # Deploy all apps
        deploy_app "Admin Dashboard" "admin-dashboard" "admin-localbookr.netlify.app"
        deploy_app "Customer App" "frontend" "customer-localbookr.netlify.app"
        deploy_app "Partner Dashboard" "partner-dashboard" "partner-localbookr.netlify.app"
        deploy_backend
        ;;
    7)
        echo -e "${YELLOW}👋 Exiting deployment...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment URLs:${NC}"
echo "👤 Admin: https://admin-localbookr.netlify.app"
echo "🛍 Customer: https://customer-localbookr.netlify.app"
echo "💼 Partner: https://partner-localbookr.netlify.app"
echo "⚡ API: https://api-localbookr.netlify.app"