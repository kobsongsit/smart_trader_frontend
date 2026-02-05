#!/bin/bash

# Smart Trader Frontend - Plesk Deployment Script
# Run this script after git pull on Plesk server

echo "=== Smart Trader Frontend Deployment ==="

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build the application
echo "Building application..."
npm run build

echo "=== Deployment Complete ==="
echo ""
echo "Build output: .output/server/index.mjs"
echo ""
echo "สำหรับ Plesk Node.js Extension:"
echo "  - Application Startup File: .output/server/index.mjs"
echo "  - กด 'Restart App' ใน Plesk panel"
