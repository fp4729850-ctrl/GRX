# BRICSPAY Global Backend - Implementation Plan

## 📋 Current State Analysis

### ✅ Completed
- **Schema**: Complete Prisma schema with all models (User, Wallet, Invoice, Certificate, Oracle, Partner, etc.)
- **Module Structure**: All modules created (Auth, Users, Wallets, Tokens, Invoices, Certificates, Oracles, Partners, Admin)
- **Core Setup**: 
  - Prisma service configured
  - JWT authentication setup
  - Swagger documentation configured
  - CORS enabled
  - Rate limiting (Throttler) configured
- **Auth Module**: 
  - Registration ✅
  - Login ✅
  - JWT token generation ✅
  - Password hashing ✅

### ⚠️ Partially Implemented
- **Users Module**: Basic findById, findByEmail only
- **Wallets Module**: Empty (TODO)
- **Tokens Module**: Empty (TODO)
- **Invoices Module**: Empty (TODO)
- **Certificates Module**: Empty (TODO)
- **Oracles Module**: Empty (TODO)
- **Partners Module**: Empty (TODO)
- **Admin Module**: Empty (TODO)

### ❌ Missing Features
- DTOs for all modules
- Service implementations
- Controller endpoints
- Validation pipes
- Error handling
- Business logic
- Blockchain integration (ethers.js)
- Oracle price fetching
- Certificate verification
- Settlement processing
- Audit logging
- 2FA implementation
- KYC document handling

---

## 🏗️ Architecture Overview

```
backend/
├── prisma/
│   ├── schema.prisma          ✅ Complete
│   └── migrations/             ⚠️ Needs initial migration
├── src/
│   ├── main.ts                ✅ Complete
│   ├── app.module.ts          ✅ Complete
│   ├── common/                ⚠️ Needs utilities
│   │   ├── prisma/            ✅ Complete
│   │   ├── decorators/        ❌ Empty
│   │   ├── filters/           ❌ Empty
│   │   ├── guards/            ❌ Empty (except JWT)
│   │   └── interceptors/      ❌ Empty
│   ├── auth/                  ✅ 70% Complete
│   ├── users/                 ⚠️ 20% Complete
│   ├── wallets/               ❌ 0% Complete
│   ├── tokens/                ❌ 0% Complete
│   ├── invoices/              ❌ 0% Complete
│   ├── certificates/          ❌ 0% Complete
│   ├── oracles/               ❌ 0% Complete
│   ├── partners/              ❌ 0% Complete
│   └── admin/                 ❌ 0% Complete
```

---

## 📦 Module Implementation Plan

### 1. **Common Module** (Priority: HIGH)

#### Files to Create:
```
common/
├── decorators/
│   ├── roles.decorator.ts          # @Roles() decorator
│   ├── public.decorator.ts         # @Public() for public routes
│   └── current-user.decorator.ts   # @CurrentUser() for user extraction
├── filters/
│   ├── http-exception.filter.ts    # Global exception filter
│   └── prisma-exception.filter.ts  # Prisma error handling
├── guards/
│   ├── roles.guard.ts              # Role-based access control
│   └── admin.guard.ts              # Admin-only routes
├── interceptors/
│   ├── logging.interceptor.ts      # Request logging
│   └── transform.interceptor.ts    # Response transformation
└── utils/
    ├── encryption.util.ts          # Private key encryption
    ├── validation.util.ts          # Custom validators
    └── blockchain.util.ts         # Blockchain helpers
```

---

### 2. **Users Module** (Priority: HIGH)

#### DTOs Needed:
```typescript
// dto/update-user.dto.ts
// dto/update-kyc.dto.ts
// dto/upload-kyc.dto.ts
// dto/enable-2fa.dto.ts
```

#### Service Methods:
- `updateProfile(userId, data)`
- `uploadKycDocument(userId, file)`
- `updateKycStatus(userId, status)`
- `enable2FA(userId)`
- `disable2FA(userId)`
- `getAllUsers(filters, pagination)`
- `getUserStats()`

#### Controller Endpoints:
```
GET    /users/me
PATCH  /users/me
POST   /users/me/kyc/upload
PATCH  /users/me/kyc/status
POST   /users/me/2fa/enable
POST   /users/me/2fa/disable
GET    /users (admin only)
GET    /users/:id (admin only)
GET    /users/stats (admin only)
```

---

### 3. **Wallets Module** (Priority: HIGH)

#### DTOs Needed:
```typescript
// dto/create-wallet.dto.ts
// dto/import-wallet.dto.ts
// dto/get-balance.dto.ts
```

#### Service Methods:
- `createWallet(userId, network, isCustodial)`
- `importWallet(userId, privateKey, network)`
- `getWalletByAddress(address)`
- `getUserWallets(userId)`
- `getBalance(address, network)`
- `getTokenBalance(address, tokenAddress, network)`
- `encryptPrivateKey(privateKey, password)`
- `decryptPrivateKey(encryptedKey, password)`

#### Controller Endpoints:
```
POST   /wallets
POST   /wallets/import
GET    /wallets
GET    /wallets/:address
GET    /wallets/:address/balance
GET    /wallets/:address/token-balance
```

#### Blockchain Integration:
- Use `ethers.js` for wallet creation
- Support multiple networks (Polygon, Ethereum, BSC)
- Handle testnet/mainnet switching
- Encrypt custodial wallet private keys

---

### 4. **Tokens Module** (Priority: HIGH)

#### DTOs Needed:
```typescript
// dto/mint.dto.ts
// dto/burn.dto.ts
// dto/transfer.dto.ts
// dto/mint-proposal.dto.ts
```

#### Service Methods:
- `mintToken(certId, to, amount)`
- `burnToken(invoiceId, amount)`
- `transferToken(from, to, amount)`
- `createMintProposal(userId, certId, amount)`
- `approveMintProposal(proposalId, signature)`
- `executeMintProposal(proposalId)`
- `getTokenBalance(address)`
- `getTotalSupply()`

#### Controller Endpoints:
```
POST   /tokens/mint
POST   /tokens/burn
POST   /tokens/transfer
POST   /tokens/mint-proposals
GET    /tokens/mint-proposals
POST   /tokens/mint-proposals/:id/approve
POST   /tokens/mint-proposals/:id/execute
GET    /tokens/balance/:address
GET    /tokens/supply
```

#### Blockchain Integration:
- Interact with GRX token contract
- Handle multisig minting
- Track mint/burn transactions
- Verify on-chain events

---

### 5. **Invoices Module** (Priority: HIGH)

#### DTOs Needed:
```typescript
// dto/create-invoice.dto.ts
// dto/redeem-invoice.dto.ts
// dto/settle-invoice.dto.ts
```

#### Service Methods:
- `createInvoice(userId, recipient, amount)`
- `getInvoice(invoiceId)`
- `getUserInvoices(userId, filters)`
- `redeemInvoice(invoiceId, userId)`
- `burnInvoice(invoiceId)`
- `settleInvoice(invoiceId, partnerId)`
- `getInvoiceStatus(invoiceId)`
- `expireInvoices()`

#### Controller Endpoints:
```
POST   /invoices
GET    /invoices
GET    /invoices/:invoiceId
POST   /invoices/:invoiceId/redeem
POST   /invoices/:invoiceId/burn
POST   /invoices/:invoiceId/settle
GET    /invoices/:invoiceId/status
```

#### Business Logic:
- Generate unique invoiceId (keccak256 hash)
- Track invoice lifecycle (RECEIVED → AWAITING_REDEEM → BURN_PENDING → SETTLED)
- Handle expiration
- Integrate with settlement module

---

### 6. **Certificates Module** (Priority: MEDIUM)

#### DTOs Needed:
```typescript
// dto/verify-certificate.dto.ts
// dto/create-certificate.dto.ts
```

#### Service Methods:
- `createCertificate(vaultPartner, payload, signature)`
- `verifyCertificate(certId, payload, signature)`
- `getCertificate(certId)`
- `getCertificatesByPartner(partner)`
- `updateCertificateStatus(certId, status)`
- `getPendingCertificates()`

#### Controller Endpoints:
```
POST   /certificates
GET    /certificates/:certId
GET    /certificates
POST   /certificates/:certId/verify
PATCH  /certificates/:certId/status
GET    /certificates/partner/:partner
```

#### Vault Integration:
- Verify signatures from vault partners (MMTC_PAMP, AUGMONT, SAFEGOLD, DMCC)
- Validate certificate payload
- Track certificate status

---

### 7. **Oracles Module** (Priority: HIGH)

#### DTOs Needed:
```typescript
// dto/create-snapshot.dto.ts
// dto/get-snapshot.dto.ts
```

#### Service Methods:
- `fetchGoldPrice(source)` // LBMA, COMEX, MCX
- `fetchFxRates()` // INR, AED, RUB, CNY
- `createSnapshot(goldPrice, fxRates, source)`
- `getLatestSnapshot()`
- `getSnapshotByTimestamp(timestamp)`
- `getSnapshots(dateRange)`
- `aggregatePrices(sources)`

#### Controller Endpoints:
```
GET    /oracles/latest
GET    /oracles/snapshots
GET    /oracles/snapshots/:id
POST   /oracles/snapshots (admin only)
GET    /oracles/gold-price
GET    /oracles/fx-rates
```

#### External APIs:
- LBMA API for gold prices
- COMEX API for gold prices
- MCX API for gold prices
- Currency exchange APIs (Fixer.io, ExchangeRate-API)
- Scheduled job to fetch prices every 10 minutes

---

### 8. **Partners Module** (Priority: MEDIUM)

#### DTOs Needed:
```typescript
// dto/create-partner.dto.ts
// dto/update-partner.dto.ts
// dto/authenticate-partner.dto.ts
```

#### Service Methods:
- `createPartner(name, apiKey, webhookUrl, currencies)`
- `authenticatePartner(apiKey)`
- `getPartner(partnerId)`
- `updatePartner(partnerId, data)`
- `suspendPartner(partnerId)`
- `getSettlementsByPartner(partnerId)`
- `sendSettlementWebhook(partnerId, settlement)`

#### Controller Endpoints:
```
POST   /partners (admin only)
GET    /partners
GET    /partners/:id
PATCH  /partners/:id (admin only)
POST   /partners/:id/suspend (admin only)
GET    /partners/:id/settlements
POST   /partners/authenticate
```

#### Security:
- API key hashing (SHA256)
- IP allowlist validation
- Webhook signature verification

---

### 9. **Admin Module** (Priority: MEDIUM)

#### DTOs Needed:
```typescript
// dto/admin-stats.dto.ts
// dto/admin-actions.dto.ts
```

#### Service Methods:
- `getDashboardStats()`
- `getAllUsers(filters, pagination)`
- `getAllTransactions(filters, pagination)`
- `getAllInvoices(filters, pagination)`
- `updateUserKycStatus(userId, status)`
- `suspendUser(userId)`
- `getSystemLogs(filters, pagination)`
- `getOracleStatus()`
- `getPlatformMetrics()`

#### Controller Endpoints:
```
GET    /admin/dashboard
GET    /admin/users
GET    /admin/transactions
GET    /admin/invoices
PATCH  /admin/users/:id/kyc
POST   /admin/users/:id/suspend
GET    /admin/logs
GET    /admin/oracle/status
GET    /admin/metrics
```

---

### 10. **Settlements Module** (NEW - Priority: HIGH)

#### Create New Module:
```
settlements/
├── settlements.module.ts
├── settlements.service.ts
└── settlements.controller.ts
```

#### DTOs Needed:
```typescript
// dto/create-settlement.dto.ts
// dto/process-settlement.dto.ts
```

#### Service Methods:
- `createSettlement(invoiceId, partnerId)`
- `calculateSettlementAmount(invoiceAmount, currency, oracleSnapshot)`
- `generateSettlementPacket(settlement)`
- `signSettlementPacket(settlement)`
- `processSettlement(settlementId)`
- `confirmSettlement(settlementId, txHash)`
- `getSettlementsByPartner(partnerId)`

#### Controller Endpoints:
```
POST   /settlements
GET    /settlements
GET    /settlements/:id
POST   /settlements/:id/process
POST   /settlements/:id/confirm
GET    /settlements/partner/:partnerId
```

---

## 🔧 Common Utilities Needed

### 1. **Blockchain Service**
```typescript
// common/services/blockchain.service.ts
- getProvider(network, isTestnet)
- getContract(address, abi, network)
- sendTransaction(signedTx)
- waitForTransaction(txHash)
- getBlockNumber(network)
- estimateGas(tx)
```

### 2. **Encryption Service**
```typescript
// common/services/encryption.service.ts
- encrypt(data, password)
- decrypt(encryptedData, password)
- hash(data) // SHA256
- generateKey()
```

### 3. **Audit Service**
```typescript
// common/services/audit.service.ts
- logAction(userId, action, resourceType, resourceId, details)
- getAuditLogs(filters, pagination)
```

### 4. **Queue Service** (BullMQ)
```typescript
// common/services/queue.service.ts
- addJob(queueName, jobData)
- processQueue(queueName, processor)
- Queues: oracle-updates, invoice-expiration, settlement-processing
```

---

## 📝 Database Migrations

### Initial Migration:
```bash
npx prisma migrate dev --name init
```

### Seed Data:
```typescript
// prisma/seed.ts
- Create admin user
- Create default partner
- Create test users
```

---

## 🧪 Testing Strategy

### Unit Tests:
- Service methods
- Utility functions
- DTO validation

### Integration Tests:
- API endpoints
- Database operations
- Blockchain interactions

### E2E Tests:
- Complete user flows
- Invoice lifecycle
- Settlement process

---

## 🚀 Implementation Priority

### Phase 1 (Week 1-2): Core Infrastructure
1. ✅ Common utilities (decorators, guards, filters)
2. ✅ Users module (complete)
3. ✅ Wallets module (complete)
4. ✅ Blockchain service integration

### Phase 2 (Week 3-4): Token & Invoice System
1. ✅ Tokens module (mint/burn)
2. ✅ Invoices module (create/redeem/settle)
3. ✅ Certificates module (verify)
4. ✅ Settlements module (new)

### Phase 3 (Week 5-6): Oracle & Partners
1. ✅ Oracles module (price fetching)
2. ✅ Partners module (API integration)
3. ✅ Scheduled jobs (cron)
4. ✅ Queue processing

### Phase 4 (Week 7-8): Admin & Polish
1. ✅ Admin module (complete)
2. ✅ Audit logging
3. ✅ Error handling
4. ✅ Documentation
5. ✅ Testing

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "@nestjs/schedule": "^4.0.0",        // Cron jobs
    "@nestjs/bullmq": "^10.0.0",          // Queue processing
    "axios": "^1.6.0",                    // HTTP requests
    "crypto-js": "^4.2.0",               // Encryption
    "node-cron": "^3.0.3",               // Cron scheduling
    "uuid": "^9.0.1"                     // UUID generation
  }
}
```

---

## 🔐 Security Considerations

1. **API Rate Limiting**: ✅ Already configured (100 req/min)
2. **JWT Expiration**: Set to 24 hours
3. **Password Hashing**: ✅ Using bcrypt (10 rounds)
4. **Private Key Encryption**: AES-256-GCM
5. **Input Validation**: ✅ class-validator
6. **SQL Injection**: ✅ Prisma ORM protection
7. **CORS**: ✅ Configured
8. **API Key Hashing**: SHA256
9. **Audit Logging**: Track all sensitive operations

---

## 📊 API Endpoints Summary

### Public Endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/oracles/latest`
- `GET /api/oracles/gold-price`

### Authenticated Endpoints:
- All `/users/me/*`
- All `/wallets/*`
- All `/tokens/*`
- All `/invoices/*`
- All `/certificates/*`

### Admin Only:
- All `/admin/*`
- `PATCH /users/:id/*`
- `POST /partners/*`
- `POST /oracles/snapshots`

### Partner Endpoints:
- `POST /partners/authenticate`
- `GET /partners/:id/settlements`
- `POST /settlements/:id/confirm`

---

## 🎯 Next Steps

1. **Create TODO list** for implementation
2. **Start with Common Module** (decorators, guards, filters)
3. **Implement Users Module** (complete CRUD)
4. **Implement Wallets Module** (with blockchain integration)
5. **Implement Tokens Module** (mint/burn operations)
6. **Implement Invoices Module** (lifecycle management)
7. **Implement Oracles Module** (price fetching)
8. **Implement Settlements Module** (new)
9. **Implement Partners Module** (API integration)
10. **Implement Admin Module** (dashboard & controls)

---

## 📝 Notes

- All amounts stored as Decimal(18, 8) in database
- Use BigNumber for calculations (ethers.js)
- Timestamps in UTC
- All IDs are UUIDs
- Use transactions for multi-step operations
- Implement proper error handling
- Add comprehensive logging
- Follow NestJS best practices
- Use DTOs for all inputs/outputs
- Add Swagger documentation for all endpoints

