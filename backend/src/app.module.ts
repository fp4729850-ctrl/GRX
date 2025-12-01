import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { TokensModule } from './tokens/tokens.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CertificatesModule } from './certificates/certificates.module';
import { OraclesModule } from './oracles/oracles.module';
import { SettlementsModule } from './settlements/settlements.module';
import { PartnersModule } from './partners/partners.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    TokensModule,
    InvoicesModule,
    CertificatesModule,
    OraclesModule,
    SettlementsModule,
    PartnersModule,
    AdminModule,
  ],
})
export class AppModule {}


