import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const requireApiBase = () => {
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL.');
  }
  return API_BASE_URL;
};

export const sendCustodialTransaction = async ({
  from,
  to,
  amount,
  token,
  network,
  isTestnet,
}) => {
  const base = requireApiBase();
  const { data } = await axios.post(`${base}/api/transaction/send`, {
    from,
    to,
    amount,
    token,
    network,
    isTestnet,
  });
  return data;
};

export const redeemCustodialInvoice = async ({
  address,
  amount,
  network,
  isTestnet,
}) => {
  const base = requireApiBase();
  const { data } = await axios.post(`${base}/api/invoice/redeem`, {
    address,
    amount,
    network,
    isTestnet,
  });
  return data;
};

