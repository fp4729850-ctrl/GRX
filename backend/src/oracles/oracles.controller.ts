import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OraclesService } from './oracles.service';

@ApiTags('oracles')
@Controller('oracle')
export class OraclesController {
  constructor(private readonly oraclesService: OraclesService) {}

  // TODO: Implement oracle endpoints
}


