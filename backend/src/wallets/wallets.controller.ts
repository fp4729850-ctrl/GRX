import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@Controller('wallet')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // TODO: Implement wallet endpoints
}


