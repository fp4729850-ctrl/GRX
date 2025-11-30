# BRICSPAY Global Backend API

Backend API for BRICSPAY Global (GRX) - A gold-backed token platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

4. **Start development server**
```bash
npm run start:dev
```

5. **Access API Documentation**
```
http://localhost:3000/api/docs
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed script
├── src/
│   ├── main.ts                # Application entry point
│   ├── app.module.ts          # Root module
│   ├── auth/                  # Authentication module
│   ├── users/                 # User management
│   ├── wallets/               # Wallet operations
│   ├── tokens/                # Token minting/burning
│   ├── invoices/              # Invoice management
│   ├── certificates/          # Certificate verification
│   ├── oracles/               # Price oracle feeds
│   ├── settlements/           # Settlement processing
│   ├── partners/              # Partner API management
│   ├── admin/                 # Admin dashboard
│   └── common/                # Shared utilities
│       ├── decorators/        # Custom decorators
│       ├── guards/            # Auth guards
│       ├── filters/           # Exception filters
│       ├── interceptors/      # Request interceptors
│       └── services/          # Shared services
└── package.json
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - AES encryption key (32 bytes hex)
- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint
- `BSC_RPC_URL` - BSC RPC endpoint
- `GRX_*_ADDRESS` - GRX token contract addresses
- Oracle API keys (LBMA, COMEX, MCX)
- Vault partner public keys

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile
- `POST /api/users/me/kyc/upload` - Upload KYC document
- `POST /api/users/me/2fa/enable` - Enable 2FA

### Wallets
- `POST /api/wallets` - Create wallet
- `POST /api/wallets/import` - Import wallet
- `GET /api/wallets` - Get user wallets
- `GET /api/wallets/:address/balance` - Get balance

### Tokens
- `POST /api/tokens/mint` - Mint GRX tokens
- `POST /api/tokens/burn` - Burn GRX tokens
- `POST /api/tokens/transfer` - Transfer tokens
- `POST /api/tokens/proposals` - Create mint proposal

### Invoices
- `POST /api/invoice/create` - Create invoice
- `GET /api/invoice` - Get user invoices
- `POST /api/invoice/:invoiceId/redeem` - Redeem invoice
- `POST /api/invoice/:invoiceId/settle` - Settle invoice

### Certificates
- `POST /api/cert` - Create certificate
- `GET /api/cert/:certId` - Get certificate
- `POST /api/cert/:certId/verify` - Verify certificate

### Oracles
- `GET /api/oracle/latest` - Get latest snapshot (Public)
- `GET /api/oracle` - Get snapshots (Admin/Partner)
- `POST /api/oracle/snapshot` - Create snapshot (Admin)

### Settlements
- `POST /api/settlements` - Create settlement
- `GET /api/settlements/:settlementId` - Get settlement
- `POST /api/settlements/:settlementId/process` - Process settlement

### Partners
- `POST /api/partner` - Create partner (Admin)
- `POST /api/partner/authenticate` - Authenticate (Public)
- `GET /api/partner/:partnerId` - Get partner

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users/stats` - User statistics
- `GET /api/admin/transactions` - Transaction monitoring
- `GET /api/admin/logs` - System logs

## 🔐 Security Features

- JWT authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- Private key encryption (AES-256-GCM)
- API key hashing
- IP allowlist for partners
- Rate limiting (100 req/min)
- Input validation
- Audit logging

## 🛠️ Development

### Run migrations
```bash
npm run prisma:migrate
```

### Generate Prisma Client
```bash
npm run prisma:generate
```

### View database
```bash
npm run prisma:studio
```

### Run tests
```bash
npm test
```

### Lint code
```bash
npm run lint
```

## 📝 Database Seed

The seed script creates:
- Admin user: `admin@bricspay.com` / `admin123`
- Default settlement partner
- Test users: `user1@test.com`, `user2@test.com` / `test123`

Run with:
```bash
npm run prisma:seed
```

## 🔄 Scheduled Jobs

- **Oracle Snapshots**: Created every 10 minutes automatically
- **Invoice Expiration**: Can be triggered manually (Admin only)

## 📦 Dependencies

Key dependencies:
- `@nestjs/*` - NestJS framework
- `@prisma/client` - Database ORM
- `ethers` - Blockchain interaction
- `bip39` - Mnemonic phrase generation
- `bcrypt` - Password hashing
- `@nestjs/schedule` - Cron jobs
- `axios` - HTTP requests
- `speakeasy` - 2FA (TOTP)

## 🚨 Important Notes

1. **Never commit `.env` file** - Contains sensitive keys
2. **Change default passwords** - Update seed script passwords
3. **Secure encryption keys** - Generate strong keys for production
4. **Configure RPC endpoints** - Use your own Infura/Alchemy keys
5. **Set up Oracle API keys** - For real price feeds

## 📄 License

MIT
