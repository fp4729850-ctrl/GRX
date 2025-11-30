import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadKycDto } from './dto/upload-kyc.dto';
import { Enable2FADto, Disable2FADto } from './dto/enable-2fa.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @Post('me/kyc/upload')
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiResponse({ status: 201, description: 'KYC document uploaded successfully' })
  async uploadKyc(
    @CurrentUser() user: any,
    @Body() uploadKycDto: UploadKycDto,
  ) {
    return this.usersService.uploadKycDocument(user.id, uploadKycDto);
  }

  @Patch('me/kyc/status')
  @ApiOperation({ summary: 'Update KYC status (admin only)' })
  @UseGuards(AdminGuard)
  @ApiResponse({ status: 200, description: 'KYC status updated successfully' })
  async updateKycStatus(
    @CurrentUser() user: any,
    @Body() updateKycStatusDto: UpdateKycStatusDto,
  ) {
    return this.usersService.updateKycStatus(user.id, updateKycStatusDto);
  }

  @Post('me/2fa/enable')
  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  async enable2FA(
    @CurrentUser() user: any,
    @Body() enable2FADto: Enable2FADto,
  ) {
    return this.usersService.enable2FA(user.id, enable2FADto.code);
  }

  @Post('me/2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disable2FA(
    @CurrentUser() user: any,
    @Body() disable2FADto: Disable2FADto,
  ) {
    return this.usersService.disable2FA(user.id, disable2FADto.code);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('role') role?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getAllUsers(
      {
        role: role as any,
        kycStatus: kycStatus as any,
        search,
      },
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      },
    );
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}


