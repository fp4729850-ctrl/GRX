# BRICSPAY Global Backend API

NestJS backend API for BRICSPAY Global (GRX) platform.

## Features

- User authentication (JWT, 2FA)
- Wallet management (custodial & non-custodial)
- Token minting and burning
- Invoice lifecycle management
- Certificate integration
- Oracle price feeds
- Partner API
- Admin dashboard APIs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up MySQL database and run Prisma migrations:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api/docs`

## Database Schema

The Prisma schema includes:
- Users (with KYC status)
- Wallets (custodial and non-custodial)
- Certificates (from vault partners)
- Invoices (with lifecycle states)
- Settlements
- Oracle snapshots
- Partners
- Mint proposals
- Audit logs
- Proof of reserve

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/user/profile` - Get user profile

### Wallets
- `GET /api/wallet/{address}/balance` - Get wallet balance
- `POST /api/wallet/create` - Create custodial wallet

### Tokens
- `POST /api/token/mint` - Propose mint (multisig)
- `POST /api/token/burn` - Burn tokens with invoice

### Invoices
- `GET /api/invoice/{id}` - Get invoice details
- `POST /api/invoice/{id}/redeem` - Redeem invoice (initiate burn)

### Certificates
- `POST /api/cert/submit` - Submit certificate from vault

### Oracles
- `GET /api/oracle/latest` - Get latest price snapshot

### Partners
- `POST /api/partner/payout-confirmation` - Confirm payout

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/propose-mint` - Propose mint for multisig

## Development

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Linting
npm run lint
```

## Database Migrations

```bash
# Create new migration
npm run prisma:migrate

# View database in Prisma Studio
npm run prisma:studio
```

## Security Notes

- Change `JWT_SECRET` in production
- Use environment variables for all secrets
- Enable rate limiting (configured via ThrottlerModule)
- Use HTTPS in production
- Implement proper CORS policies


