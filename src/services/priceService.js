import axios from 'axios';
import { COINGECKO_API } from '../utils/constants';

/**
 * Fetch ETH and USDT prices from CoinGecko
 */
export const fetchTokenPrices = async () => {
  try {
    const response = await axios.get(COINGECKO_API, {
      params: {
        ids: 'ethereum,tether',
        vs_currencies: 'usd',
      },
    });
    
    return {
      eth: response.data.ethereum?.usd || 0,
      usdt: response.data.tether?.usd || 1,
    };
  } catch (error) {
    console.error('Error fetching token prices:', error);
    // Return default values on error
    return {
      eth: 0,
      usdt: 1,
    };
  }
};

