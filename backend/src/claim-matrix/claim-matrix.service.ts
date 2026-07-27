import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClaimMatrixService {
  constructor(private prisma: PrismaService) {}

  async getMatrix() {
    const claims = await this.prisma.claim_matrix.findMany();
    return claims.map(claim => ({
      ...claim,
      amount: claim.amount.toNumber(),
    }));
  }

  async initialMint(country: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const existing = await this.prisma.claim_matrix.findUnique({
      where: {
        ownerVault_reserveVault: {
          ownerVault: country,
          reserveVault: country
        }
      }
    });

    if (existing) {
      return this.prisma.claim_matrix.update({
        where: { id: existing.id },
        data: {
          amount: { increment: amount },
          updatedAt: new Date()
        }
      });
    }

    return this.prisma.claim_matrix.create({
      data: {
        id: uuidv4(),
        ownerVault: country,
        reserveVault: country,
        amount: amount,
        updatedAt: new Date()
      }
    });
  }

  async transfer(fromCountry: string, toCountry: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.prisma.$transaction(async (tx) => {
      const holdings = await tx.claim_matrix.findMany({
        where: { ownerVault: fromCountry }
      });

      const totalBalance = holdings.reduce((sum, h) => sum + h.amount.toNumber(), 0);
      if (totalBalance < amount) {
        throw new BadRequestException(`Insufficient balance for ${fromCountry}`);
      }

      const foreignHoldings = holdings.filter(h => h.reserveVault !== fromCountry);
      const domesticHolding = holdings.find(h => h.reserveVault === fromCountry);

      let remainingAmountToTransfer = amount;
      const transferActions = [];

      for (const holding of foreignHoldings) {
        if (remainingAmountToTransfer <= 0) break;

        const available = holding.amount.toNumber();
        if (available > 0) {
          const deductAmount = Math.min(available, remainingAmountToTransfer);
          
          transferActions.push({
            reserveVault: holding.reserveVault,
            deductAmount
          });

          remainingAmountToTransfer -= deductAmount;
        }
      }

      if (remainingAmountToTransfer > 0 && domesticHolding) {
        const available = domesticHolding.amount.toNumber();
        if (available < remainingAmountToTransfer) {
           throw new BadRequestException('Unexpected error: domestic holding insufficient despite total balance check');
        }

        transferActions.push({
          reserveVault: domesticHolding.reserveVault,
          deductAmount: remainingAmountToTransfer
        });
        remainingAmountToTransfer = 0;
      }

      for (const action of transferActions) {
        await tx.claim_matrix.update({
          where: {
            ownerVault_reserveVault: {
              ownerVault: fromCountry,
              reserveVault: action.reserveVault
            }
          },
          data: {
            amount: { decrement: action.deductAmount },
            updatedAt: new Date()
          }
        });

        const existingTo = await tx.claim_matrix.findUnique({
          where: {
            ownerVault_reserveVault: {
              ownerVault: toCountry,
              reserveVault: action.reserveVault
            }
          }
        });

        if (existingTo) {
          await tx.claim_matrix.update({
            where: { id: existingTo.id },
            data: {
              amount: { increment: action.deductAmount },
              updatedAt: new Date()
            }
          });
        } else {
          await tx.claim_matrix.create({
            data: {
              id: uuidv4(),
              ownerVault: toCountry,
              reserveVault: action.reserveVault,
              amount: action.deductAmount,
              updatedAt: new Date()
            }
          });
        }
      }

      return { success: true, message: 'Transfer successful' };
    });
  }
}
