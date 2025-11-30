import { Global, Module } from '@nestjs/common';
import { BlockchainService } from './services/blockchain.service';
import { EncryptionService } from './services/encryption.service';
import { AuditService } from './services/audit.service';

@Global()
@Module({
  providers: [BlockchainService, EncryptionService, AuditService],
  exports: [BlockchainService, EncryptionService, AuditService],
})
export class CommonModule {}

