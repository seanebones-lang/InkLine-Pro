#!/bin/bash

# Quick start script for web demo
# Usage: ./scripts/start-web-demo.sh

set -e

echo "🚀 Starting InkLine Pro Web Demo..."
echo ""
echo "This will start the app in web demo mode with:"
echo "  ✅ Auto-login (demo user)"
echo "  ✅ Mocked AI generation"
echo "  ✅ Pre-loaded history"
echo "  ✅ All UI features working"
echo ""
echo "Press Ctrl+C to stop"
echo ""

export EXPO_PUBLIC_WEB_DEMO=true
npm run web
