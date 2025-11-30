-- This migration adds missing foreign key constraints
-- First ensure users table has proper PRIMARY KEY

SET FOREIGN_KEY_CHECKS = 0;

-- Ensure users.id is PRIMARY KEY (should already be, but verify structure)
-- Check if users table exists and has id as PRIMARY KEY
-- If not, this will fail but that's expected

-- For kyc_documents, ensure userId column exists and matches users.id type
-- Then add foreign key

-- Try to add index on users.id if it doesn't exist (PRIMARY KEY should cover this)
-- But MySQL requires explicit index for foreign key references

-- Drop existing foreign key if it exists
SET @fk_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'kyc_documents'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME LIKE '%userId%'
  LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL,
  CONCAT('ALTER TABLE `kyc_documents` DROP FOREIGN KEY `', @fk_name, '`'),
  'SELECT "No existing foreign key to drop"'
);

SET @sql_exec = IF(@fk_name IS NOT NULL, @sql, 'SELECT 1');
PREPARE stmt FROM @sql_exec;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now add the foreign key
-- Ensure both columns have same charset and collation
ALTER TABLE `kyc_documents` 
MODIFY COLUMN `userId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `users` 
MODIFY COLUMN `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Add foreign key constraint
ALTER TABLE `kyc_documents` 
ADD CONSTRAINT `kyc_documents_userId_fkey` 
FOREIGN KEY (`userId`) 
REFERENCES `users`(`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

