import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class OraclesService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement oracle operations
}


