import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PartnersService } from './partners.service';

@ApiTags('partners')
@Controller('partner')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // TODO: Implement partner endpoints
}


