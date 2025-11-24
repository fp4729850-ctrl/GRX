import axios from 'axios';
import { ORACLE_API_URL } from '../utils/constants';

const FALLBACK_PRICE = 62.5; // USD per GRX placeholder
const FALLBACK_FEE_PERCENT = 0.005; // 0.5%
const FALLBACK_FLAT_FEE = 5; // USD

export const fetchGrxOracleQuote = async (amount = '0') => {
  const numericAmount = parseFloat(amount || '0');

  if (ORACLE_API_URL) {
    try {
      const { data } = await axios.post(ORACLE_API_URL, {
        amount: numericAmount,
      });
      return data;
    } catch (error) {
      console.warn('Oracle API unavailable, using fallback quote', error?.message);
    }
  }

  const priceUSD = numericAmount * FALLBACK_PRICE;
  const feeUSD = priceUSD * FALLBACK_FEE_PERCENT + FALLBACK_FLAT_FEE;

  return {
    pricePerToken: FALLBACK_PRICE,
    feeUSD: Number.isFinite(feeUSD) ? feeUSD : 0,
    totalUSD: Number.isFinite(priceUSD + feeUSD) ? priceUSD + feeUSD : 0,
  };
};


