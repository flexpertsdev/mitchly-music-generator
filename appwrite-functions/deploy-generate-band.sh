#!/bin/bash

# Deploy generate-band function to Appwrite
# This script helps deploy the function with proper configuration

echo "🚀 Deploying generate-band function to Appwrite..."
echo ""

# Check if appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI is not installed."
    echo "Install it with: npm install -g appwrite"
    exit 1
fi

# Navigate to function directory
cd "$(dirname "$0")/generate-band" || exit 1

echo "📦 Creating deployment package..."

# Create deployment
echo "📤 Deploying function..."
appwrite functions createDeployment \
  --functionId="generate-band" \
  --entrypoint="src/index.js" \
  --activate=true \
  --code="."

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "⚠️  IMPORTANT: Make sure to set the following environment variables in Appwrite Console:"
    echo "   1. Go to: https://cloud.appwrite.io/console/project-flexos/functions/function-generate-band"
    echo "   2. Click on 'Settings' tab"
    echo "   3. Scroll to 'Variables' section"
    echo "   4. Add these variables:"
    echo "      - APPWRITE_API_KEY = [Your API key from Settings > API Keys]"
    echo "      - ANTHROPIC_API_KEY = [Your Anthropic API key]"
    echo "      - FAL_API_KEY = [Your FAL.ai API key] (optional for images)"
    echo ""
    echo "   Note: These are FUNCTION-LEVEL variables, not global variables"
else
    echo "❌ Deployment failed. Please check your configuration."
fi