import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { VerifyCertificateDto } from './dto/verify-certificate.dto';
import { UpdateCertificateStatusDto } from './dto/update-certificate-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('certificates')
@Controller('cert')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @Public() // Vault partners can create certificates without auth
  @ApiOperation({ summary: 'Create certificate from vault partner' })
  @ApiResponse({ status: 201, description: 'Certificate created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCertificate(@Body() dto: CreateCertificateDto) {
    return this.certificatesService.createCertificate(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificates (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'List of certificates' })
  async getCertificates(
    @Query('partner') partner?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (partner) {
      return this.certificatesService.getCertificatesByPartner(
        partner,
        status,
        limit ? parseInt(limit, 10) : 50,
        offset ? parseInt(offset, 10) : 0,
      );
    }

    if (status === 'PENDING') {
      return this.certificatesService.getPendingCertificates(
        limit ? parseInt(limit, 10) : 50,
        offset ? parseInt(offset, 10) : 0,
      );
    }

    // Default: get pending certificates
    return this.certificatesService.getPendingCertificates(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('partner/:partner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificates by vault partner (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'List of certificates' })
  async getCertificatesByPartner(
    @Param('partner') partner: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.certificatesService.getCertificatesByPartner(
      partner,
      status,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending certificates (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'List of pending certificates' })
  async getPendingCertificates(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.certificatesService.getPendingCertificates(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':certId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate by certId' })
  @ApiResponse({ status: 200, description: 'Certificate details' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async getCertificate(@Param('certId') certId: string) {
    return this.certificatesService.getCertificate(certId);
  }

  @Post(':certId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify certificate (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'Certificate verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async verifyCertificate(
    @Param('certId') certId: string,
    @Body() dto: Omit<VerifyCertificateDto, 'certId'>,
  ) {
    return this.certificatesService.verifyCertificate({
      certId,
      ...dto,
    });
  }

  @Patch(':certId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update certificate status (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async updateStatus(
    @Param('certId') certId: string,
    @Body() dto: UpdateCertificateStatusDto,
  ) {
    return this.certificatesService.updateCertificateStatus(certId, dto);
  }
}
