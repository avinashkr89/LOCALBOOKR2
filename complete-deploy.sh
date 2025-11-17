#!/bin/bash
# LocalBookr Complete Deployment Script - GitHub + Netlify
# Usage: ./complete-deploy.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 LocalBookr Platform Complete Deployment${NC}"
echo -e "${BLUE}=======================================${NC}"

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    echo -e "${RED}❌ Deployment failed at step: $2${NC}"
    exit 1
}

success_message() {
    echo -e "${GREEN}✅ Success: $1${NC}"
}

echo -e "${YELLOW}📋 Step 1: Environment Check${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    handle_error "Node.js not installed" "https://nodejs.org/en/download/"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    handle_error "npm not installed" "https://www.npmjs.com/get-npm/"
fi

# Check if project structure exists
if [ ! -d "frontend" ] || [ ! -d "admin-dashboard" ] || [ ! -d "partner-dashboard" ] || [ ! -d "backend" ]; then
    handle_error "Project structure not complete" "Run project setup first"
fi

success_message "Environment checked"

echo -e "${YELLOW}📝 Step 2: Git Repository Setup${NC}"

# Git initialization
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "🎉 Initial commit: Complete LocalBookr platform with vendor management system"
    success_message "Git repository initialized"
fi

# Check for GitHub remote
if ! git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}⚙️  GitHub repository not connected${NC}"
    echo -e "${YELLOW}Please set up your GitHub repository:${NC}"
    echo -e "${YELLOW}1. Create GitHub repository: https://github.com/new${NC}"
    echo -e "${YELLOW}   Repository name: localbookr${NC}"
    echo -e "${YELLOW}   Description: Complete local service booking platform with WhatsApp reminders${NC}"
    echo -e "${YELLOW}   Choose: Public${NC}"
    echo -e "${YELLOW}2. Initialize and push:${NC}"
    echo -e "${YELLOW}   git remote add origin https://github.com/yourusername/localbookr.git${NC}"
    echo -e "${YELLOW}   git push -u origin main${NC}"
    echo -e "${YELLOW}3. Or use this script with repository URL:${NC}"
    echo -e "${YELLOW}   ./complete-deploy.sh https://github.com/yourusername/localbookr.git${NC}"
    echo -e "${NC}Press any key to continue after GitHub setup...${NC}"
    read -n
else
    success_message "Git repository connected"
fi

# GitHub URL from command line argument
GITHUB_REPO="$1"
if [ -n "$1" ] && [[ $1 == http* || $1 == https* ]]; then
    GITHUB_REPO="$1"
    echo -e "${YELLOW}📋 Using GitHub repository: $GITHUB_REPO${NC}"

    # Update git remote
    git remote set-url origin "$GITHUB_REPO"

    # Push latest changes
    echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
    git add .
    git commit -m "🚀 Deployment update: $(date +'%Y-%m-%d %H:%M')"
    git push -u origin main || handle_error "Failed to push to GitHub"
    success_message "Changes pushed to GitHub"
fi

echo -e "${YELLOW}📋 Step 3: Install Netlify CLI${NC}"

# Install Netlify CLI globally
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
    success_message "Netlify CLI installed"
fi

echo -e "${YELLOW}📋 Step 4: Build Applications${NC}"

# Build all applications
echo -e "${BLUE}🏗 Building Customer App...${NC}"
cd frontend && npm run build || handle_error "Customer app build failed"
cd ..

echo -e "${BLUE}🏗 Building Admin Dashboard...${NC}"
cd admin-dashboard && npm run build || handle_error "Admin dashboard build failed"
cd ..

echo -e "${BLUE}🏗 Building Partner Dashboard...${NC}"
cd partner-dashboard && npm run build || handle_error "Partner dashboard build failed"
cd ..

success_message "All applications built successfully"

echo -e "${YELLOW}📋 Step 5: Deploy to Netlify${NC}"

# Deploy applications to Netlify
echo -e "${BLUE}🚀 Deploying Customer App to Netlify...${NC}"
netlify deploy --prod --dir=frontend/.next --site=localbookr-customer --message="Customer app deployment $(date +'%Y-%m-%d')" || handle_error "Customer app deployment failed"

echo -e "${BLUE}🚀 Deploying Admin Dashboard to Netlify...${NC}"
netlify deploy --prod --dir=admin-dashboard/.next --site=localbookr-admin --message="Admin dashboard deployment $(date +'%Y-%m-%d')" || handle_error "Admin dashboard deployment failed"

echo -e "${BLUE}🚀 Deploying Partner Dashboard to Netlify...${NC}"
netlify deploy --prod --dir=partner-dashboard/.next --site=localbookr-partner --message="Partner dashboard deployment $(date +'%Y-%m-%d')" || handle_error "Partner dashboard deployment failed"

# Store deployment URLs
CUSTOMER_URL="https://localbookr-customer.netlify.app"
ADMIN_URL="https://localbookr-admin.netlify.app"
PARTNER_URL="https://localbookr-partner.netlify.app"

success_message "All applications deployed to Netlify!"

echo -e "${YELLOW}📋 Step 6: Environment Setup Instructions${NC}"

cat << 'EOF'

${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}

${BLUE}📱 LIVE URLs:${NC}
🛍 Customer App: $CUSTOMER_URL
👤 Admin Panel: $ADMIN_URL
👥 Partner Dashboard: $PARTNER_URL

${YELLOW}⚙️  ENVIRONMENT VARIABLES SETUP REQUIRED:${NC}

${YELLOW}Netlify Dashboard Setup:${NC}
1. Go to app.netlify.com
2. Select your site (localbookr-admin, etc.)
3. Go to Site settings → Build & deploy → Environment
4. Add these variables:

${BLUE}🔧 FRONTEND VARIABLES:${NC}
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

${BLUE}🔧 BACKEND VARIABLES (for serverless functions):${NC}
DATABASE_URL=postgresql://[project-id]@[host]:[port]/postgres
JWT_SECRET=your-super-secret-jwt-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

${BLUE}🔧 WHATSAPP/SMS VARIABLES:${NC}
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

${BLUE}🔧 FILE STORAGE VARIABLES:${NC}
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

${YELLOW}📋 ALTERNATIVE: Use Railway/Render for Backend:${NC}
1. Deploy backend to Railway or Render
2. Get the deployed backend URL
3. Update NEXT_PUBLIC_API_URL in Netlify with your backend URL

${YELLOW}📋 FOR QUICK SETUP:${NC}
Run this for environment setup template:
netlify env:set NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1 --site=localbookr-admin

EOF

echo -e "${GREEN}🎉 LocalBookr Platform Deployment Complete!${NC}"
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}📚 Next Steps:${NC}"
echo -e "1. Set environment variables in Netlify dashboard${NC}"
echo -e "2. Deploy backend to Railway/Render${NC}"
echo -e "3. Test all applications${NC}"