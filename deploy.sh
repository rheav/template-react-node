#!/bin/bash

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Setup Database
echo "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE messagedb;" || true
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'your_password';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE messagedb TO appuser;"

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Deploy Backend
echo "Deploying backend..."
cd server
npm install
npx prisma generate
npx prisma migrate deploy

# Start backend with PM2
pm2 delete message-app-backend || true
pm2 start index.js --name "message-app-backend"

# Deploy Frontend
echo "Deploying frontend..."
cd ../client
npm install
npm run build

echo "Deployment completed!"
