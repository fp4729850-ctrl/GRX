import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorer: string;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Get network configuration
   */
  getNetworkConfig(network: string, isTestnet: boolean): NetworkConfig {
    const networks: Record<string, NetworkConfig> = {
      ETHEREUM_MAINNET: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl:
          this.configService.get<string>('ETHEREUM_RPC_URL') ||
          'https://mainnet.infura.io/v3/5ac894977b43497b8851db51173be16a',
        symbol: 'ETH',
        explorer: 'https://etherscan.io',
      },
      ETHEREUM_TESTNET: {
        name: 'Ethereum Sepolia',
        chainId: 11155111,
        rpcUrl:
          this.configService.get<string>('ETHEREUM_TESTNET_RPC_URL') ||
          'https://sepolia.infura.io/v3/5ac894977b43497b8851db51173be16a',
        symbol: 'ETH',
        explorer: 'https://sepolia.etherscan.io',
      },
      BSC_MAINNET: {
        name: 'BNB Chain',
        chainId: 56,
        rpcUrl:
          this.configService.get<string>('BSC_RPC_URL') ||
          'https://bsc-mainnet.infura.io/v3/5ac894977b43497b8851db51173be16a',
        symbol: 'BNB',
        explorer: 'https://bscscan.com',
      },
      BSC_TESTNET: {
        name: 'BNB Chain Testnet',
        chainId: 97,
        rpcUrl:
          this.configService.get<string>('BSC_TESTNET_RPC_URL') ||
          'https://data-seed-prebsc-1-s1.binance.org:8545/',
        symbol: 'BNB',
        explorer: 'https://testnet.bscscan.com',
      },
      POLYGON_MAINNET: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl:
          this.configService.get<string>('POLYGON_RPC_URL') ||
          'https://polygon-rpc.com',
        symbol: 'MATIC',
        explorer: 'https://polygonscan.com',
      },
      POLYGON_TESTNET: {
        name: 'Polygon Mumbai',
        chainId: 80001,
        rpcUrl:
          this.configService.get<string>('POLYGON_TESTNET_RPC_URL') ||
          'https://rpc-mumbai.maticvigil.com',
        symbol: 'MATIC',
        explorer: 'https://mumbai.polygonscan.com',
      },
    };

    const key = isTestnet
      ? `${network}_TESTNET`
      : `${network}_MAINNET`;

    return networks[key] || networks.ETHEREUM_MAINNET;
  }

  /**
   * Get provider for a network
   */
  getProvider(network: string, isTestnet: boolean): ethers.JsonRpcProvider {
    const config = this.getNetworkConfig(network, isTestnet);
    const key = `${network}_${isTestnet ? 'testnet' : 'mainnet'}`;

    if (!this.providers.has(key)) {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
        name: config.name,
        chainId: config.chainId,
      });
      this.providers.set(key, provider);
    }

    return this.providers.get(key)!;
  }

  /**
   * Get contract instance
   */
  getContract(
    address: string,
    abi: ethers.InterfaceAbi,
    network: string,
    isTestnet: boolean,
  ): ethers.Contract {
    const provider = this.getProvider(network, isTestnet);
    return new ethers.Contract(address, abi, provider);
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    signedTx: string,
    network: string,
    isTestnet: boolean,
  ): Promise<ethers.TransactionResponse> {
    const provider = this.getProvider(network, isTestnet);
    return provider.broadcastTransaction(signedTx);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    network: string,
    isTestnet: boolean,
    confirmations: number = 1,
  ): Promise<ethers.TransactionReceipt> {
    const provider = this.getProvider(network, isTestnet);
    return provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(network: string, isTestnet: boolean): Promise<number> {
    const provider = this.getProvider(network, isTestnet);
    return provider.getBlockNumber();
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    tx: ethers.TransactionRequest,
    network: string,
    isTestnet: boolean,
  ): Promise<bigint> {
    const provider = this.getProvider(network, isTestnet);
    return provider.estimateGas(tx);
  }

  /**
   * Create wallet
   */
  createWallet(): ethers.HDNodeWallet {
    return ethers.Wallet.createRandom();
  }

  /**
   * Create wallet from private key
   */
  createWalletFromPrivateKey(
    privateKey: string,
    network: string,
    isTestnet: boolean,
  ): ethers.Wallet {
    const provider = this.getProvider(network, isTestnet);
    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Get balance (native token)
   */
  async getBalance(
    address: string,
    network: string,
    isTestnet: boolean,
  ): Promise<bigint> {
    const provider = this.getProvider(network, isTestnet);
    return provider.getBalance(address);
  }

  /**
   * Get token balance (ERC20)
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    network: string,
    isTestnet: boolean,
  ): Promise<bigint> {
    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
    ];
    const contract = this.getContract(tokenAddress, erc20Abi, network, isTestnet);
    return contract.balanceOf(walletAddress);
  }
}

