#!/bin/bash
set -e

echo "=== Skincare Content Factory - Auto Deploy to Railway ==="
echo ""

# Check if Railway CLI is installed
if ! command -v railway >/dev/null 2>&1; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "Logging into Railway..."
railway login

# Create new project
echo "Creating Railway project..."
railway init skincare-content-factory

# Link to project
echo "Linking to project..."
railway link

# Add PostgreSQL
echo "Adding PostgreSQL database..."
railway add postgresql

# Set environment variables for backend
echo "Setting up backend environment variables..."
railway variables set DATABASE_URL="\$(RAILWAY_POSTGRESQL_URL)"
railway variables set SECRET_KEY="$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)"
railway variables set GEMINI_API_KEY="AIzaSyD46Z4nNuUKIeCsFpCwiTO8cDmUvfcbqx0"
railway variables set GEMINI_MODEL="gemini-1.5-pro"
railway variables set ACCESS_TOKEN_EXPIRE_MINUTES="1440"

# Deploy backend
echo "Deploying backend..."
railway up --service backend

# Set environment variables for frontend
echo "Setting up frontend environment variables..."
railway variables set BACKEND_URL="http://backend.railway.internal"

# Deploy frontend
echo "Deploying frontend..."
railway up --service frontend

echo ""
echo "=== Deployment Complete! ==="
echo "Your app should be available at the Railway domain shown above."
echo ""
echo "Next steps:"
echo "1. Run the database schema: psql <DATABASE_URL> -f schema.sql"
echo "2. Create admin user: Register at /register then promote in DB"
echo "3. Test the app!"
