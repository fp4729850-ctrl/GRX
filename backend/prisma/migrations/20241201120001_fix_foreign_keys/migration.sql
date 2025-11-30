-- Fix all foreign key constraints
-- Ensure all tables have proper charset and foreign keys

SET FOREIGN_KEY_CHECKS = 0;

-- Ensure users table has proper structure
ALTER TABLE `users` 
MODIFY COLUMN `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Fix wallets table foreign key
ALTER TABLE `wallets` 
MODIFY COLUMN `userId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Drop existing foreign key if exists
ALTER TABLE `wallets` DROP FOREIGN KEY IF EXISTS `wallets_userId_fkey`;
ALTER TABLE `wallets` DROP FOREIGN KEY IF EXISTS `FK_2ecdb33f23e9a6fc392025c0b97`;

-- Add foreign key for wallets
ALTER TABLE `wallets` 
ADD CONSTRAINT `wallets_userId_fkey` 
FOREIGN KEY (`userId`) 
REFERENCES `users`(`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix invoices table - ensure id is PRIMARY KEY
ALTER TABLE `invoices` 
MODIFY COLUMN `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `invoices` 
MODIFY COLUMN `userId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `invoices` DROP FOREIGN KEY IF EXISTS `invoices_userId_fkey`;

ALTER TABLE `invoices` 
ADD CONSTRAINT `invoices_userId_fkey` 
FOREIGN KEY (`userId`) 
REFERENCES `users`(`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix audit_logs table foreign key
ALTER TABLE `audit_logs` 
MODIFY COLUMN `userId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `audit_logs` DROP FOREIGN KEY IF EXISTS `audit_logs_userId_fkey`;

ALTER TABLE `audit_logs` 
ADD CONSTRAINT `audit_logs_userId_fkey` 
FOREIGN KEY (`userId`) 
REFERENCES `users`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Fix mint_proposals table foreign key
ALTER TABLE `mint_proposals` 
MODIFY COLUMN `userId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `mint_proposals` DROP FOREIGN KEY IF EXISTS `mint_proposals_userId_fkey`;

ALTER TABLE `mint_proposals` 
ADD CONSTRAINT `mint_proposals_userId_fkey` 
FOREIGN KEY (`userId`) 
REFERENCES `users`(`id`) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Ensure partners and oracle_snapshots tables exist and have proper id columns (PRIMARY KEY)
ALTER TABLE `partners` 
MODIFY COLUMN `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `oracle_snapshots` 
MODIFY COLUMN `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Fix settlements table foreign keys
ALTER TABLE `settlements` 
MODIFY COLUMN `invoiceId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `settlements` 
MODIFY COLUMN `partnerId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `settlements` 
MODIFY COLUMN `oracleSnapshotId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `settlements` DROP FOREIGN KEY IF EXISTS `settlements_invoiceId_fkey`;
ALTER TABLE `settlements` DROP FOREIGN KEY IF EXISTS `settlements_partnerId_fkey`;
ALTER TABLE `settlements` DROP FOREIGN KEY IF EXISTS `settlements_oracleSnapshotId_fkey`;

-- Add foreign keys for settlements (invoices.id should be PRIMARY KEY which has index)
ALTER TABLE `settlements` 
ADD CONSTRAINT `settlements_invoiceId_fkey` 
FOREIGN KEY (`invoiceId`) 
REFERENCES `invoices`(`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

ALTER TABLE `settlements` 
ADD CONSTRAINT `settlements_partnerId_fkey` 
FOREIGN KEY (`partnerId`) 
REFERENCES `partners`(`id`) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

ALTER TABLE `settlements` 
ADD CONSTRAINT `settlements_oracleSnapshotId_fkey` 
FOREIGN KEY (`oracleSnapshotId`) 
REFERENCES `oracle_snapshots`(`id`) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

