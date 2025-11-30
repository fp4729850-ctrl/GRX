import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [CertificatesService],
  controllers: [CertificatesController],
  exports: [CertificatesService],
})
export class CertificatesModule {}
