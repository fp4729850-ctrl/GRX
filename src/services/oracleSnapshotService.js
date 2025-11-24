import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const requireApiBase = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "API base URL missing. Set EXPO_PUBLIC_API_BASE_URL to enable oracle snapshots."
    );
  }
  return API_BASE_URL;
};

export const fetchOracleSnapshot = async () => {
  const base = requireApiBase();
  const { data } = await axios.get(`${base}/api/oracle/latest`);
  return data;
};


