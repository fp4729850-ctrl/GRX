import {
  Controller,
  Get,
  Post,
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
import { TokensService } from './tokens.service';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';
import { TransferDto } from './dto/transfer.dto';
import { CreateMintProposalDto } from './dto/create-mint-proposal.dto';
import { ApproveMintProposalDto } from './dto/approve-mint-proposal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('tokens')
@Controller('tokens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post('mint')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiOperation({ summary: 'Mint GRX tokens with certificate (requires MINTER_ROLE)' })
  @ApiResponse({ status: 201, description: 'Tokens minted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async mint(
    @CurrentUser() user: any,
    @Body() dto: MintDto,
    @Query('minterWallet') minterWallet?: string,
  ) {
    return this.tokensService.mint(
      user.sub || user.id,
      dto,
      minterWallet,
    );
  }

  @Post('burn')
  @ApiOperation({ summary: 'Burn GRX tokens with invoice' })
  @ApiResponse({ status: 200, description: 'Burn instructions returned' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async burn(@CurrentUser() user: any, @Body() dto: BurnDto) {
    return this.tokensService.burn(user.sub || user.id, dto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer GRX tokens' })
  @ApiResponse({ status: 200, description: 'Transfer instructions returned' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async transfer(@CurrentUser() user: any, @Body() dto: TransferDto) {
    return this.tokensService.transfer(user.sub || user.id, dto);
  }

  @Post('proposals')
  @ApiOperation({ summary: 'Create a mint proposal (for multisig)' })
  @ApiResponse({ status: 201, description: 'Proposal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createProposal(
    @CurrentUser() user: any,
    @Body() dto: CreateMintProposalDto,
  ) {
    return this.tokensService.createMintProposal(user.sub || user.id, dto);
  }

  @Post('proposals/:proposalId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a mint proposal (add signature)' })
  @ApiResponse({ status: 200, description: 'Proposal approved' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async approveProposal(
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: any,
    @Body() dto: Omit<ApproveMintProposalDto, 'proposalId'>,
  ) {
    return this.tokensService.approveMintProposal(user.sub || user.id, {
      proposalId,
      signature: dto.signature,
    });
  }

  @Post('proposals/:proposalId/execute')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute an approved mint proposal' })
  @ApiResponse({ status: 200, description: 'Proposal executed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async executeProposal(
    @Param('proposalId') proposalId: string,
    @Query('minterWallet') minterWallet?: string,
  ) {
    return this.tokensService.executeMintProposal(proposalId, minterWallet);
  }

  @Get('proposals')
  @ApiOperation({ summary: 'Get mint proposals for current user' })
  @ApiResponse({ status: 200, description: 'List of proposals' })
  async getProposals(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.tokensService.getProposals(user.sub || user.id, status);
  }

  @Get('balance/:address')
  @ApiOperation({ summary: 'Get GRX token balance for an address' })
  @ApiResponse({ status: 200, description: 'Token balance' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getBalance(
    @Param('address') address: string,
    @Query('network') network: string = 'ETHEREUM',
    @Query('isTestnet') isTestnet: string = 'true',
  ) {
    return this.tokensService.getBalance(
      address,
      network,
      isTestnet === 'true',
    );
  }
}
