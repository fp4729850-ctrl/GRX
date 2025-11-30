# Backend Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file in `backend/` directory:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/bricspay?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Encryption
ENCRYPTION_KEY="your-32-byte-hex-encryption-key"

# RPC URLs (use your own keys)
ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
BSC_RPC_URL="https://bsc-mainnet.infura.io/v3/YOUR_KEY"

# GRX Contract Addresses (update after deployment)
GRX_ETHEREUM_MAINNET_ADDRESS="0x..."
GRX_BSC_MAINNET_ADDRESS="0x..."

# Oracle API Keys (optional for development)
LBMA_API_KEY=""
COMEX_API_KEY=""
MCX_API_KEY=""

# Server
PORT=3000
NODE_ENV="development"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database (if not exists)
# mysql -u root -p
# CREATE DATABASE bricspay;

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

### 4. Start Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 5. Verify Setup

1. Check server is running: `http://localhost:3000`
2. Check Swagger docs: `http://localhost:3000/api/docs`
3. Test registration: `POST /api/auth/register`
4. Test login: `POST /api/auth/login`

## Default Credentials (from seed)

- **Admin**: `admin@bricspay.com` / `admin123`
- **Test User 1**: `user1@test.com` / `test123`
- **Test User 2**: `user2@test.com` / `test123`

## Troubleshooting

### Database Connection Issues
- Check MySQL is running
- Verify DATABASE_URL format
- Ensure database exists

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and reinstall

### Prisma Errors
- Run `npm run prisma:generate`
- Check schema.prisma syntax
- Verify migrations are applied

### Port Already in Use
- Change PORT in .env
- Kill process using port 3000

## Next Steps

1. Configure Oracle API keys for real price feeds
2. Deploy GRX contracts and update addresses
3. Set up production environment variables
4. Configure webhook URLs for partners
5. Set up monitoring and logging

