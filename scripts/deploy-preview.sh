#!/bin/bash

# Deploy Preview Build Script
# This script builds and optionally submits a preview build for testing

set -e

echo "🚀 Starting preview build deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed. Installing...${NC}"
    npm install -g eas-cli
fi

# Check if logged in to Expo
echo -e "${YELLOW}📋 Checking Expo login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo. Please login:${NC}"
    eas login
fi

# Run tests first
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test -- --passWithNoTests || {
    echo -e "${RED}❌ Tests failed. Please fix tests before building.${NC}"
    exit 1
}

# Ask for platform
echo -e "${YELLOW}📱 Select platform:${NC}"
echo "1) iOS"
echo "2) Android"
echo "3) Both"
read -p "Enter choice [1-3]: " platform_choice

case $platform_choice in
    1)
        PLATFORM="ios"
        ;;
    2)
        PLATFORM="android"
        ;;
    3)
        PLATFORM="all"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Ask if should auto-submit
read -p "Auto-submit to TestFlight/Internal Testing? (y/n): " auto_submit

# Build command
BUILD_CMD="eas build --profile preview --platform $PLATFORM"

if [ "$auto_submit" = "y" ]; then
    BUILD_CMD="$BUILD_CMD --auto-submit"
fi

echo -e "${GREEN}🔨 Starting build...${NC}"
echo -e "${YELLOW}Command: $BUILD_CMD${NC}"

# Execute build
eval $BUILD_CMD

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Wait for build to complete on EAS servers"
    echo "2. Check build status: eas build:list"
    echo "3. Download build: eas build:download"
    echo "4. Install on device for testing"
else
    echo -e "${RED}❌ Build failed. Check logs above.${NC}"
    exit 1
fi
