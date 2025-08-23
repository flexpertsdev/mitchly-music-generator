#!/bin/bash

# Appwrite Function Deployment Script
# Usage: ./deploy-function.sh [function-directory-name]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if function directory is provided
if [ "$#" -ne 1 ]; then
    echo -e "${RED}Error: Please provide the function directory name${NC}"
    echo "Usage: ./deploy-function.sh [function-directory-name]"
    echo "Example: ./deploy-function.sh generate-band-v2"
    exit 1
fi

FUNCTION_DIR="$1"
FUNCTION_NAME="${FUNCTION_DIR}"
TAR_FILE="${FUNCTION_NAME}.tar.gz"

# Check if directory exists
if [ ! -d "$FUNCTION_DIR" ]; then
    echo -e "${RED}Error: Directory '$FUNCTION_DIR' not found${NC}"
    exit 1
fi

# Navigate to function directory
cd "$FUNCTION_DIR"

# Check for required files
echo -e "${YELLOW}Checking required files...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found in $FUNCTION_DIR${NC}"
    echo "package.json must be at the root of your function directory"
    exit 1
fi

if [ ! -d "src" ]; then
    echo -e "${RED}Error: src directory not found${NC}"
    exit 1
fi

if [ ! -f "src/main.js" ]; then
    echo -e "${RED}Error: src/main.js not found${NC}"
    echo "Entry point must be at src/main.js"
    exit 1
fi

# Optional files check
if [ -f "README.md" ]; then
    echo -e "${GREEN}✓ README.md found${NC}"
else
    echo -e "${YELLOW}⚠ README.md not found (recommended)${NC}"
fi

if [ -d "static" ] && [ -f "static/index.html" ]; then
    echo -e "${GREEN}✓ Test interface found (static/index.html)${NC}"
else
    echo -e "${YELLOW}⚠ No test interface found (recommended for user-facing functions)${NC}"
fi

# Clean up old tar file if exists
if [ -f "../$TAR_FILE" ]; then
    echo -e "${YELLOW}Removing old $TAR_FILE...${NC}"
    rm "../$TAR_FILE"
fi

# Create the tar.gz file with proper structure
echo -e "${YELLOW}Creating deployment package...${NC}"

# List of files/directories to include
FILES_TO_INCLUDE=""

# Required files
FILES_TO_INCLUDE="$FILES_TO_INCLUDE package.json"

# Add package-lock.json if it exists
if [ -f "package-lock.json" ]; then
    FILES_TO_INCLUDE="$FILES_TO_INCLUDE package-lock.json"
fi

# Add directories
FILES_TO_INCLUDE="$FILES_TO_INCLUDE src"

if [ -d "static" ]; then
    FILES_TO_INCLUDE="$FILES_TO_INCLUDE static"
fi

# Add optional files if they exist
if [ -f "README.md" ]; then
    FILES_TO_INCLUDE="$FILES_TO_INCLUDE README.md"
fi

if [ -f "env.d.ts" ]; then
    FILES_TO_INCLUDE="$FILES_TO_INCLUDE env.d.ts"
fi

if [ -f ".env.example" ]; then
    FILES_TO_INCLUDE="$FILES_TO_INCLUDE .env.example"
fi

# Create tar with files at root level
tar -czf "../$TAR_FILE" $FILES_TO_INCLUDE

cd ..

# Verify the package
echo -e "${YELLOW}Verifying package structure...${NC}"
echo -e "${YELLOW}First 15 files in package:${NC}"
tar -tzf "$TAR_FILE" | head -15

# Check that package.json is at root
if tar -tzf "$TAR_FILE" | head -1 | grep -q "^package.json$"; then
    echo -e "${GREEN}✓ Package structure verified: package.json is at root${NC}"
else
    echo -e "${RED}⚠ Warning: package.json might not be at root level${NC}"
    echo "First file in archive: $(tar -tzf "$TAR_FILE" | head -1)"
fi

# Get file size
FILE_SIZE=$(du -h "$TAR_FILE" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment package created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📦 Package: ${GREEN}$TAR_FILE${NC}"
echo -e "📏 Size: ${GREEN}$FILE_SIZE${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Deploy via Appwrite CLI:"
echo -e "${GREEN}   appwrite functions createDeployment \\
     --functionId=\"$FUNCTION_NAME\" \\
     --entrypoint=\"src/main.js\" \\
     --code=\"./$TAR_FILE\" \\
     --activate=true${NC}"
echo ""
echo "2. Or upload via Appwrite Console:"
echo "   - Go to Functions → Your Function → Deployments"
echo "   - Click 'Create Deployment'"
echo "   - Upload $TAR_FILE"
echo "   - Set entrypoint: src/main.js"
echo ""
echo "3. Configure environment variables:"
echo "   Check README.md for required variables"
echo ""

# Check for .env.example
if [ -f "$FUNCTION_DIR/.env.example" ]; then
    echo -e "${YELLOW}📋 Environment variables from .env.example:${NC}"
    cat "$FUNCTION_DIR/.env.example" | grep -v '^#' | grep '=' | cut -d'=' -f1 | while read var; do
        echo "   - $var"
    done
    echo ""
fi