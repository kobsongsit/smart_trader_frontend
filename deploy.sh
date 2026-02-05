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

# Restart PM2 process
echo "Restarting PM2..."
pm2 restart ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production

echo "=== Deployment Complete ==="
pm2 status
