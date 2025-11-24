import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const requireApiBase = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "API base URL missing. Set EXPO_PUBLIC_API_BASE_URL to enable custodial invoice flows."
    );
  }
  return API_BASE_URL;
};

export const fetchBackendInvoices = async ({ address }) => {
  const base = requireApiBase();
  const { data } = await axios.get(`${base}/api/invoice`, {
    params: { address },
  });
  return data?.invoices || data || [];
};

export const fetchBackendInvoiceDetail = async (invoiceId) => {
  const base = requireApiBase();
  const { data } = await axios.get(`${base}/api/invoice/${invoiceId}`);
  return data;
};


