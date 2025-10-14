# Optimeal Backend

Backend API for Optimeal application built with Node.js, Express, TypeScript, Prisma and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 or higher)

### Setup

1. **Create environment file:**
   
   Create a `.env` file in the project root with the following variables:
   
   ```env
   # AWS Cognito Configuration
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_CLIENT_ID=your_cognito_client_id_here
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
   
   # Database Configuration (already configured in docker-compose.yml)
   DATABASE_URL=postgresql://postgres:password@localhost:5432/optimeal?schema=public
   
   # Delivery Shifts Configuration (Optional)
   # Define available delivery shifts as a comma-separated list of time ranges
   # Format: HH-HH:MM or HH:MM-HH or HH:MM-HH:MM
   # Default (if not set): 11-11:30,11:30-12,12-12:30,12:30-13,13-13:30,13:30-14,14-14:30,14:30-15
   DELIVERY_SHIFTS=11-11:30,11:30-12,12-12:30,12:30-13,13-13:30,13:30-14,14-14:30,14:30-15
   
   # Email Configuration (for order status notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASSWORD=your_app_password_here
   APP_LOGO_URL=https://your-bucket.s3.region.amazonaws.com/logo.png
   ```

### 🐳 Run with Docker

1. **Start all services (including automatic database initialization):**
   ```bash
   docker compose up --build -d
   ```

2. **Check services status:**
   ```bash
   docker compose ps
   ```