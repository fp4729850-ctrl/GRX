import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement token mint/burn operations
}


