-- Create all missing tables first, then add foreign keys in separate step
-- This ensures proper table creation order

SET FOREIGN_KEY_CHECKS = 0;

-- Create wallets table if not exists (with proper structure)
CREATE TABLE IF NOT EXISTS `wallets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `isCustodial` BOOLEAN NOT NULL DEFAULT false,
    `privateKeyEncrypted` VARCHAR(191) NULL,
    `network` VARCHAR(191) NOT NULL DEFAULT 'POLYGON',
    `isTestnet` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `wallets_address_key`(`address`),
    INDEX `wallets_userId_idx`(`userId`),
    INDEX `wallets_address_idx`(`address`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create invoices table if not exists
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 8) NOT NULL,
    `status` ENUM('RECEIVED', 'AWAITING_REDEEM', 'BURN_PENDING', 'USED', 'SETTLED', 'EXPIRED') NOT NULL DEFAULT 'RECEIVED',
    `transferTxHash` VARCHAR(191) NULL,
    `burnTxHash` VARCHAR(191) NULL,
    `burnBlockNumber` BIGINT NULL,
    `burnTimestamp` DATETIME(3) NULL,
    `settlementAmount` DECIMAL(18, 8) NULL,
    `settlementCurrency` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `payoutTxHash` VARCHAR(191) NULL,
    `oracleSnapshotId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `invoices_invoiceId_key`(`invoiceId`),
    INDEX `invoices_invoiceId_idx`(`invoiceId`),
    INDEX `invoices_userId_idx`(`userId`),
    INDEX `invoices_status_idx`(`status`),
    INDEX `invoices_recipient_idx`(`recipient`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create certificates table if not exists
CREATE TABLE IF NOT EXISTS `certificates` (
    `id` VARCHAR(191) NOT NULL,
    `certId` VARCHAR(191) NOT NULL,
    `vaultPartner` VARCHAR(191) NOT NULL,
    `vaultCertId` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `payloadHash` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `grams` DECIMAL(18, 8) NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'MINTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `mintedAt` DATETIME(3) NULL,
    `mintTxHash` VARCHAR(191) NULL,
    `mintedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `certificates_certId_key`(`certId`),
    INDEX `certificates_certId_idx`(`certId`),
    INDEX `certificates_vaultPartner_idx`(`vaultPartner`),
    INDEX `certificates_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create oracle_snapshots table if not exists
CREATE TABLE IF NOT EXISTS `oracle_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `blockNumber` BIGINT NULL,
    `goldPriceUSD` DECIMAL(18, 8) NOT NULL,
    `fxRates` TEXT NOT NULL,
    `signature` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `oracle_snapshots_timestamp_idx`(`timestamp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create partners table if not exists
CREATE TABLE IF NOT EXISTS `partners` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `apiKey` VARCHAR(191) NOT NULL,
    `apiKeyHash` VARCHAR(191) NOT NULL,
    `webhookUrl` VARCHAR(191) NULL,
    `ipAllowlist` TEXT NULL,
    `supportedCurrencies` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `partners_apiKey_key`(`apiKey`),
    INDEX `partners_apiKeyHash_idx`(`apiKeyHash`),
    INDEX `partners_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create settlements table if not exists
CREATE TABLE IF NOT EXISTS `settlements` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 8) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `fxRate` DECIMAL(18, 8) NOT NULL,
    `goldPrice` DECIMAL(18, 8) NOT NULL,
    `oracleSnapshotId` VARCHAR(191) NOT NULL,
    `settlementPacket` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'CONFIRMED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `payoutTxHash` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `settlements_invoiceId_key`(`invoiceId`),
    INDEX `settlements_invoiceId_idx`(`invoiceId`),
    INDEX `settlements_partnerId_idx`(`partnerId`),
    INDEX `settlements_oracleSnapshotId_idx`(`oracleSnapshotId`),
    INDEX `settlements_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create mint_proposals table if not exists
CREATE TABLE IF NOT EXISTS `mint_proposals` (
    `id` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `certId` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 8) NOT NULL,
    `metadata` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'EXECUTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `signatures` TEXT NOT NULL,
    `executedAt` DATETIME(3) NULL,
    `txHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `mint_proposals_proposalId_key`(`proposalId`),
    INDEX `mint_proposals_proposalId_idx`(`proposalId`),
    INDEX `mint_proposals_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_resourceType_idx`(`resourceType`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create proof_of_reserve table if not exists
CREATE TABLE IF NOT EXISTS `proof_of_reserve` (
    `id` VARCHAR(191) NOT NULL,
    `merkleRoot` VARCHAR(191) NOT NULL,
    `blockNumber` BIGINT NULL,
    `txHash` VARCHAR(191) NULL,
    `certificateIds` TEXT NOT NULL,
    `totalGrams` DECIMAL(18, 8) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `proof_of_reserve_merkleRoot_key`(`merkleRoot`),
    INDEX `proof_of_reserve_merkleRoot_idx`(`merkleRoot`),
    INDEX `proof_of_reserve_createdAt_idx`(`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

