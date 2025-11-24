import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@Controller('cert')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // TODO: Implement certificate endpoints
}


