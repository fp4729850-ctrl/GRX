import { ethers } from 'ethers';

export interface ComputeGrxFromUsdParams {
  desiredUsd: number;
  goldPerGramUSD: number;
  feePct: number;
  precision?: number;
  fxRate?: number | null;
}

export interface ComputeGrxFromUsdResult {
  gramsNeeded: number;
  gramsWithFees: number;
  finalGrams: number;
  amountWei: string;
  usdValue: number;
  localFiatValue: number | null;
}

const roundUp = (value: number, precision: number): number => {
  const factor = Math.pow(10, precision);
  return Math.ceil(value * factor) / factor;
};

export const computeGrxFromUsd = ({
  desiredUsd,
  goldPerGramUSD,
  feePct,
  precision = 6,
  fxRate,
}: ComputeGrxFromUsdParams): ComputeGrxFromUsdResult => {
  if (!Number.isFinite(desiredUsd) || desiredUsd <= 0) {
    throw new Error('Desired USD must be a positive number');
  }

  if (!Number.isFinite(goldPerGramUSD) || goldPerGramUSD <= 0) {
    throw new Error('Gold price must be a positive number');
  }

  const gramsNeeded = desiredUsd / goldPerGramUSD;
  const gramsWithFees = gramsNeeded * (1 + feePct);
  const finalGrams = roundUp(gramsWithFees, precision);
  const finalGramsAsFixed = finalGrams.toFixed(precision);
  const amountWei = ethers.parseUnits(finalGramsAsFixed, 18).toString();
  const localFiatValue = fxRate
    ? Number((finalGrams * goldPerGramUSD * fxRate).toFixed(2))
    : null;

  return {
    gramsNeeded,
    gramsWithFees,
    finalGrams,
    amountWei,
    usdValue: desiredUsd,
    localFiatValue,
  };
};


