import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TokensService } from './tokens.service';

@ApiTags('tokens')
@Controller('token')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  // TODO: Implement token endpoints
}


