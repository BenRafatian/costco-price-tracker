#!/bin/bash

# Costco Price Tracker - Test Script
# This script helps verify your setup

echo "🛒 Costco Price Tracker - Configuration Test"
echo "=============================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your configuration"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

# Check Telegram Bot Token
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not set in .env"
    exit 1
fi
echo "✅ Telegram Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."

# Check Telegram Chat ID
if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ TELEGRAM_CHAT_ID not set in .env"
    exit 1
fi
echo "✅ Telegram Chat ID: $TELEGRAM_CHAT_ID"

# Check Product URLs
if [ -z "$PRODUCT_URLS" ]; then
    echo "❌ PRODUCT_URLS not set in .env"
    exit 1
fi

# Count products
IFS=',' read -ra URLS <<< "$PRODUCT_URLS"
echo "✅ Product URLs: ${#URLS[@]} product(s) configured"

echo ""
echo "Configuration looks good! 🎉"
echo ""
echo "Next steps:"
echo "1. Test run: npm start -- --once"
echo "2. If successful, run continuously: npm start"
echo ""
