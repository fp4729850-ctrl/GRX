# GRX Token Smart Contracts

This directory contains the smart contracts for the GRX (GRX Global) token, a gold-backed ERC-20 token with certificate-based minting and invoice-based burning.

## Contract Overview

**GRXToken.sol** - Main ERC-20 token contract with:
- Certificate-based minting (`mintWithCert`)
- Invoice-based burning (`burnWithInvoice`, `adminBurnWithInvoice`)
- Role-based access control (MINTER_ROLE, BURNER_ROLE, ADMIN_ROLE)
- Certificate and invoice tracking to prevent double usage
- Comprehensive events for off-chain indexing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Compile contracts:
```bash
npm run compile
```

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- Deployment and role assignment
- Minting with certificates (including double-mint prevention)
- Burning with invoices (user and admin)
- View functions and statistics
- Multiple operations

## Deployment

### Mumbai Testnet
```bash
npm run deploy:mumbai
```

### Polygon Mainnet
```bash
npm run deploy:polygon
```

**Important**: For production, set `MINTER_ADDRESS` to a Gnosis Safe multisig address, not an EOA.

## Contract Functions

### Minting
- `mintWithCert(bytes32 certId, address to, uint256 amount, string metadata)` - Mint tokens with a certificate (MINTER_ROLE only)

### Burning
- `burnWithInvoice(bytes32 invoiceId, uint256 amount)` - User-initiated burn
- `adminBurnWithInvoice(address from, bytes32 invoiceId, uint256 amount)` - Admin burn for custodial wallets (BURNER_ROLE only)

### View Functions
- `getCertificateInfo(bytes32 certId)` - Get certificate details
- `getInvoiceInfo(bytes32 invoiceId)` - Get invoice details
- `getMintingStats(address minter)` - Get minting statistics
- `getBurningStats(address burner)` - Get burning statistics

## Events

- `MintedWithCert` - Emitted when tokens are minted with a certificate
- `BurnedWithInvoice` - Emitted when user burns tokens with an invoice
- `AdminBurnedWithInvoice` - Emitted when admin burns tokens with an invoice
- `InvoiceCreated` - Emitted when an invoice is created (optional tracking)

## Security Notes

- MINTER_ROLE should be granted to a Gnosis Safe multisig in production
- Never use an EOA (Externally Owned Account) as minter in production
- All sensitive operations use ReentrancyGuard
- Certificate and invoice IDs are tracked to prevent double usage

## Verification

After deployment, verify the contract on Polygonscan:
```bash
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <ADMIN_ADDRESS> <MINTER_ADDRESS>
```


