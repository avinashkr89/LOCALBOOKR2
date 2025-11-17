#!/bin/bash
# LocalBookr GitHub + Netlify Complete Deployment Script
# Usage: ./github-deploy.sh [github-repo-url]

echo "🚀 LocalBookr GitHub + Netlify Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get GitHub repository URL
GITHUB_REPO="$1"
if [ -n "$1" ]; then
    echo -e "${YELLOW}📋 Please provide GitHub repository URL:${NC}"
    echo -e "${YELLOW}Example: https://github.com/username/localbookr${NC}"
    echo -e "${YELLOW}Or use existing repository with: gh repo view localbookr${NC}"
    exit 1
fi

# Validate GitHub URL
if [[ ! "$GITHUB_REPO" =~ ^https://github.com/.* ]]; then
    echo -e "${RED}❌ Invalid GitHub URL format${NC}"
    echo -e "${RED}Expected: https://github.com/username/repository${NC}"
    exit 1
fi

echo -e "${GREEN}📊 Repository: $GITHUB_REPO"

# Extract username and repo name
USERNAME=$(echo "$GITHUB_REPO" | sed 's|https://github.com/||g;s|.git||g')
REPO_NAME=$(echo "$GITHUB_REPO" | sed 's|.git||g')

echo -e "${BLUE}Username: $USERNAME${NC}"
echo -e "${BLUE}Repository: $REPO_NAME${NC}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Step 1: Repository Setup
echo -e "${YELLOW}🔄 Step 1: Setting up Git repository...${NC}"

# Check if current directory is a git repo
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "🎉 Initial commit: Complete LocalBookr platform"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${GREEN}✅ Git repository exists${NC}"
fi

# Add remote if not already exists
if ! git remote get-url origin &> /dev/null; then
    echo -e "${BLUE}🔗 Adding GitHub remote...${NC}"
    git remote add origin "$GITHUB_REPO"
    echo -e "${GREEN}✅ GitHub remote added${NC}"
fi

# Step 2: Commit and Push Changes
echo -e "${YELLOW}🔄 Step 2: Committing and pushing to GitHub...${NC}"
git add .
git commit -m "🚀 Deploy LocalBookr platform - $TIMESTAMP"
git push -u origin main || {
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
}

echo -e "${GREEN}✅ Pushed successfully to GitHub!${NC}"

# Step 3: Check GitHub Actions
echo -e "${YELLOW}🔄 Step 3: Checking GitHub Actions status...${NC}"

# Wait for GitHub Actions to complete
echo -e "${BLUE}⏳ Waiting for GitHub Actions to complete..."
sleep 5

# Check workflow status
if command -v gh &> /dev/null; then
    echo -e "${BLUE}📋 Checking recent workflow run..."
    # Get the latest workflow run
    WORKFLOW_STATUS=$(gh run list --limit 1 | head -1 | awk '{print $1}')
    if [[ "$WORKFLOW_STATUS" == "completed" ]]; then
        echo -e "${GREEN}✅ GitHub Actions completed successfully${NC}"
    else
        echo -e "${YELLOW}⚠ GitHub Actions may still be running. Check: https://github.com/$USERNAME/$REPO_NAME/actions${NC}"
        echo -e "${YELLOW}Workflow status: $WORKFLOW_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⚠ GitHub CLI not available${NC}"
fi

# Step 4: Netlify Deployment
echo -e "${YELLOW}🔄 Step 4: Deploying to Netlify...${NC}"

# Install Netlify CLI if not available
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Netlify CLI...${NC}"
    npm install -g netlify-cli
fi

# Deploy all applications
echo -e "${BLUE}🚀 Deploying Customer App...${NC}"
netlify deploy --prod --dir=frontend/.next --site=localbookr-customer --message="Customer app deployment $TIMESTAMP" || {
    FRONTEND_SUCCESS=false
}

echo -e "${BLUE}🚀 Deploying Admin Dashboard...${NC}"
netlify deploy --prod --dir=admin-dashboard/.next --site=localbookr-admin --message="Admin dashboard deployment $TIMESTAMP" || {
    ADMIN_SUCCESS=false
}

echo -e "${BLUE}🚀 Deploying Partner Dashboard...${NC}"
netlify deploy --prod --dir=partner-dashboard/.next --site=localbookr-partner --message="Partner dashboard deployment $TIMESTAMP" || {
    PARTNER_SUCCESS=false
}

# Step 5: Setup Environment Variables
echo -e "${YELLOW}🔧 Setting up environment variables...${NC}"

# Generate environment variables template
cat > netlify-github-env << 'EOF
# LocalBookr Platform Environment Variables
# Generated from GitHub deployment - $TIMESTAMP

# ========== PRODUCTION URLS ==========
# (These will be populated after deployment)
# NEXT_PUBLIC_API_URL=https://api-localbookr.netlify.app/.netlify/functions
# NEXT_PUBLIC_ADMIN_URL=https://localbookr-admin.netlify.app
# NEXT_PUBLIC_PARTNER_URL=https://localbookr-partner.netlify.app

# ========== BACKEND CONFIGURATION ==========
# Backend functions URL (will be Netlify Functions)
# DATABASE_URL=postgresql://postgres.your-user:password@aws.your-region.rds.amazonaws.com:5432/localbookr

# ========== AUTHENTICATION ==========
# JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key-from-supabase

# ========== NOTIFICATION SERVICES ==========
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ========== FILE STORAGE ==========
# CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud
# CLOUDINARY_API_KEY=your-cloudinary-api-key
# CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# ========== PLATFORM SETTINGS ==========
# PLATFORM_COMMISSION_RATE=10
# MINIMUM_BOOKING_AMOUNT=50
# MAXIMUM_BOOKING_ADVANCE_DAYS=90
# CANCELLATION_POLICY_HOURS=24
# AUTOMATIC_REMINDER_HOURS=2

# ========== RATE LIMITING ==========
# API_RATE_LIMIT_ENABLED=true
# NOTIFICATION_RATE_LIMIT_ENABLED=true
EOF

echo -e "${GREEN}✅ Environment variables template created${NC}"

# Step 6: Final Setup Instructions
echo -e "${YELLOW}🔧 Environment Setup Required${NC}"
echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo -e "1. In GitHub repository settings (Actions > Secrets):${NC}"
echo -e "   - Add NEXT_PUBLIC_API_URL: Your Netlify functions URL${NC}"
echo -e "   - Add JWT_SECRET: Your secure JWT secret${NC}"
echo -e "   - Add all other required environment variables${NC}"
echo ""
echo -e "${BLUE}📋 NETLIFY SETUP:${NC}"
echo -e "2. Go to https://app.netlify.com${NC}"
echo -e "3. Select your site (localbookr-customer/admin/partner)${NC}"
echo -e "4. Go to Site settings → Build & deploy → Environment${NC}"
echo -e "5. Add all environment variables from netlify-github-env file${NC}"
echo -e ""
echo -e "${BLUE}📋 BACKEND DEPLOYMENT:${NC}"
echo -e "6. Choose backend deployment option:${NC}"
echo -e "   - Option A: Netlify Functions (Recommended)${NC}"
echo -e "   - Option B: Connect to Railway/Render${NC}"
echo -e "   - Option C: Connect to your VPS${NC}"
echo -e ""
echo -e "${BLUE}📋 DATABASE SETUP:${NC}"
echo -e "   - Create Supabase project${NC}"
echo -e "   - Update DATABASE_URL in Netlify environment${NC}"
echo -e "   - Run database migrations${NC}"

# Final Success Message
if [ "$FRONTEND_SUCCESS" = true ] && [ "$ADMIN_SUCCESS" = true ] && [ "$PARTNER_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 LOCALBOOKR PLATFORM DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "========================================"
    echo -e "${BLUE}📊 LIVE URLs:${NC}"
    echo -e "🛍 Customer App: https://localbookr-customer.netlify.app${NC}"
    echo -e "👤 Admin Panel: https://localbookr-admin.netlify.app${NC}"
    echo -e "🏪 Partner Dashboard: https://localbookr-partner.netlify.app${NC}"
    echo -e "⚡ Backend API: https://api-localbookr.netlify.app/.netlify/functions${NC}"
    echo -e "${GREEN}========================================"
else
    echo -e "${RED}❌ Deployment completed with some issues${NC}"
    echo -e "${YELLOW}⚠ Please check the logs above for details${NC}"
    echo -e "${YELLOW}📋 Setup Guide: SETUP_ENVIRONMENT.md${NC}"
fi

# Make files executable
chmod +x github-deploy.sh
chmod +x netlify-github-env

echo -e "${GREEN}✅ GitHub deployment script created: github-deploy.sh${NC}"
echo -e "${GREEN}✅ Environment variables created: netlify-github-env${NC}"