-- CreateEnum
CREATE TABLE IF NOT EXISTS `UserRole` (
  `value` ENUM('INDIVIDUAL', 'INSTITUTIONAL', 'PARTNER', 'ADMIN') NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateEnum
CREATE TABLE IF NOT EXISTS `KycStatus` (
  `value` ENUM('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'EXPIRED') NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `role` ENUM('INDIVIDUAL', 'INSTITUTIONAL', 'PARTNER', 'ADMIN') NOT NULL DEFAULT 'INDIVIDUAL',
    `kycStatus` ENUM('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `kycVerifiedAt` DATETIME(3) NULL,
    `biometricEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `kyc_documents` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `documentHash` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kyc_documents_userId_idx`(`userId`),
    INDEX `kyc_documents_documentHash_idx`(`documentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

