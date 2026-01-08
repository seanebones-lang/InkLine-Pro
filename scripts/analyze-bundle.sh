#!/bin/bash

# Bundle size analysis script for React Native app
# Analyzes the bundle size and provides breakdown

set -e

echo "📦 Bundle Size Analysis"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if expo-cli is installed
if ! command -v expo &> /dev/null; then
    echo -e "${RED}❌ Error: expo-cli not found. Install it with: npm install -g expo-cli${NC}"
    exit 1
fi

# Create output directory
OUTPUT_DIR="./bundle-analysis"
mkdir -p "$OUTPUT_DIR"

echo "🔍 Analyzing bundle size..."
echo ""

# Build for iOS
echo "📱 Building iOS bundle..."
npx expo export --platform ios --output-dir "$OUTPUT_DIR/ios" 2>&1 | tee "$OUTPUT_DIR/ios-build.log" || {
    echo -e "${RED}❌ Failed to build iOS bundle${NC}"
    exit 1
}

# Build for Android
echo "🤖 Building Android bundle..."
npx expo export --platform android --output-dir "$OUTPUT_DIR/android" 2>&1 | tee "$OUTPUT_DIR/android-build.log" || {
    echo -e "${RED}❌ Failed to build Android bundle${NC}"
    exit 1
}

echo ""
echo "📊 Bundle Size Report"
echo "===================="
echo ""

# Analyze iOS bundle
if [ -d "$OUTPUT_DIR/ios" ]; then
    IOS_SIZE=$(du -sh "$OUTPUT_DIR/ios" | awk '{print $1}')
    IOS_SIZE_BYTES=$(du -sb "$OUTPUT_DIR/ios" | awk '{print $1}')
    IOS_SIZE_MB=$(echo "scale=2; $IOS_SIZE_BYTES / 1024 / 1024" | bc)
    
    echo -e "${GREEN}✅ iOS Bundle:${NC}"
    echo "   Size: $IOS_SIZE ($IOS_SIZE_MB MB)"
    
    if (( $(echo "$IOS_SIZE_MB > 10" | bc -l) )); then
        echo -e "   ${RED}⚠️  Warning: Bundle size exceeds 10MB target${NC}"
    else
        echo -e "   ${GREEN}✓ Bundle size is under 10MB target${NC}"
    fi
    
    echo ""
    
    # List largest files
    echo "   Largest files:"
    find "$OUTPUT_DIR/ios" -type f -exec du -h {} + | sort -rh | head -10 | awk '{print "   - " $2 " (" $1 ")"}'
    echo ""
fi

# Analyze Android bundle
if [ -d "$OUTPUT_DIR/android" ]; then
    ANDROID_SIZE=$(du -sh "$OUTPUT_DIR/android" | awk '{print $1}')
    ANDROID_SIZE_BYTES=$(du -sb "$OUTPUT_DIR/android" | awk '{print $1}')
    ANDROID_SIZE_MB=$(echo "scale=2; $ANDROID_SIZE_BYTES / 1024 / 1024" | bc)
    
    echo -e "${GREEN}✅ Android Bundle:${NC}"
    echo "   Size: $ANDROID_SIZE ($ANDROID_SIZE_MB MB)"
    
    if (( $(echo "$ANDROID_SIZE_MB > 10" | bc -l) )); then
        echo -e "   ${RED}⚠️  Warning: Bundle size exceeds 10MB target${NC}"
    else
        echo -e "   ${GREEN}✓ Bundle size is under 10MB target${NC}"
    fi
    
    echo ""
    
    # List largest files
    echo "   Largest files:"
    find "$OUTPUT_DIR/android" -type f -exec du -h {} + | sort -rh | head -10 | awk '{print "   - " $2 " (" $1 ")"}'
    echo ""
fi

# Generate summary
echo "📋 Summary"
echo "=========="
echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""

# Check for source map files
if find "$OUTPUT_DIR" -name "*.map" | head -1 | grep -q .; then
    echo -e "${YELLOW}⚠️  Source maps found - consider removing for production builds${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Analysis complete!${NC}"
echo ""
echo "To clean up analysis files, run: rm -rf $OUTPUT_DIR"
