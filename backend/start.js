#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting AI Homework Evaluator Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found. Creating template...');
    
    const envTemplate = `# Backend Environment Configuration
NODE_ENV=development
PORT=8000

# Google AI API Key (Required for AI features)
GOOGLE_API_KEY=your_google_api_key_here

# Firebase Service Account (Optional - will use serviceAccountKey.json if not set)
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"ai-homework-evaluator",...}

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4173

# File Upload Limits
MAX_FILE_SIZE=10485760
`;
    
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env template. Please update with your actual values.\n');
}

// Check if serviceAccountKey.json exists
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.log('⚠️  No serviceAccountKey.json found.');
    console.log('   Please download your Firebase service account key and save it as serviceAccountKey.json\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    const install = spawn('npm', ['install'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Dependencies installed successfully.\n');
            startServer();
        } else {
            console.error('❌ Failed to install dependencies.');
            process.exit(1);
        }
    });
} else {
    startServer();
}

function startServer() {
    console.log('🔧 Starting server...\n');
    
    const server = spawn('node', ['-r', 'dotenv/config', 'server.js'], { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });
    
    server.on('close', (code) => {
        console.log(`\n🛑 Server stopped with code ${code}`);
        process.exit(code);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        server.kill('SIGTERM');
    });
} 