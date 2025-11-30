import { ethers } from 'ethers';

export interface ComputeGrxFromUsdParams {
  desiredUsd: number;
  goldPerGramUSD: number;
  feePct: number;
  precision?: number;
  fxRates?: {
    USD_INR?: number | null;
    USD_AED?: number | null;
  };
}

export interface ComputeGrxFromUsdResult {
  gramsNeeded: number;
  gramsWithFees: number;
  finalGrams: number;
  amountWei: string;
  usdValue: number;
  usdCovered: number;
  inrValue: number | null;
  aedValue: number | null;
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
  fxRates,
}: ComputeGrxFromUsdParams): ComputeGrxFromUsdResult => {
  if (!Number.isFinite(desiredUsd) || desiredUsd <= 0) {
    throw new Error('Desired USD must be a positive number');
  }

  if (!Number.isFinite(goldPerGramUSD) || goldPerGramUSD <= 0) {
    throw new Error('Gold price must be a positive number');
  }

  // Core calculation: GRX = USD / goldPerGramUSD
  const gramsNeeded = desiredUsd / goldPerGramUSD;
  
  // Apply fee: GRX_final = GRX * (1 + feePct)
  const gramsWithFees = gramsNeeded * (1 + feePct);
  
  // Round up to precision
  const finalGrams = roundUp(gramsWithFees, precision);
  const finalGramsAsFixed = finalGrams.toFixed(precision);
  const amountWei = ethers.parseUnits(finalGramsAsFixed, 18).toString();
  
  // Compute USD value covered by final grams
  const usdCovered = finalGrams * goldPerGramUSD;
  
  // Local currency conversion using FX rates only (not local gold prices)
  const inrValue = fxRates?.USD_INR && Number.isFinite(fxRates.USD_INR) && fxRates.USD_INR > 0
    ? Number((usdCovered * fxRates.USD_INR).toFixed(2))
    : null;
  
  const aedValue = fxRates?.USD_AED && Number.isFinite(fxRates.USD_AED) && fxRates.USD_AED > 0
    ? Number((usdCovered * fxRates.USD_AED).toFixed(2))
    : null;

  return {
    gramsNeeded,
    gramsWithFees,
    finalGrams,
    amountWei,
    usdValue: desiredUsd,
    usdCovered,
    inrValue,
    aedValue,
  };
};


