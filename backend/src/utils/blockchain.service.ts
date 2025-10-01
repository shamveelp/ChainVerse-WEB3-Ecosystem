import axios from 'axios';
import { CustomError } from '../utils/customError';
import { StatusCode } from '../enums/statusCode.enum';
import logger from '../utils/logger';

export interface BlockchainTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  contractAddress: string;
  functionName?: string;
  methodId?: string;
  input: string;
  transactionType: 'DEX' | 'NFT_MARKETPLACE' | 'TOKEN_A' | 'TOKEN_B' | 'OTHER';
}

export interface ContractInteraction {
  contractAddress: string;
  contractName: string;
  transactionCount: number;
  transactions: BlockchainTransaction[];
}

export class BlockchainService {
  private readonly etherscanApiKey: string;
  private readonly etherscanBaseUrl: string;
  private readonly contractAddresses: {
    coinA: string;
    coinB: string;
    dex: string;
    nftMarketplace: string;
  };

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    this.etherscanBaseUrl = process.env.ETHERSCAN_BASE_URL || 'https://api-sepolia.etherscan.io/api';
    
    this.contractAddresses = {
      coinA: process.env.COIN_A_ADDRESS || '0xBcAA134722eb7307Ff50770bB3334eC4752f8067',
      coinB: process.env.COIN_B_ADDRESS || '0x994f607b3601Ba8B01163e7BD038baf138Ed7a30',
      dex: process.env.DEX_CONTRACT_ADDRESS || '0x15e57a20cD6ABf16983CB6629Aa760D40ff8C232',
      nftMarketplace: process.env.NFT_MARKETPLACE_ADDRESS || '0x9CC3f7761d3a631cC2E1C9495653B7867945A07B'
    };

    if (!this.etherscanApiKey) {
      logger.warn('Etherscan API key not found. Blockchain features may not work properly.');
    }
  }

  async getWalletTransactions(address: string, page: number = 1, limit: number = 20): Promise<{
    transactions: BlockchainTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const response = await axios.get(this.etherscanBaseUrl, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address.toLowerCase(),
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 1000, // Get more transactions to filter
          sort: 'desc',
          apikey: this.etherscanApiKey
        },
        timeout: 10000
      });

      if (response.data.status !== '1') {
        throw new CustomError(
          response.data.message || 'Failed to fetch transactions from Etherscan',
          StatusCode.BAD_REQUEST
        );
      }

      const allTransactions = response.data.result || [];
      
      // Filter transactions related to our contracts
      const contractTransactions = allTransactions.filter((tx: any) => 
        this.isContractInteraction(tx)
      );

      // Add transaction type classification
      const classifiedTransactions = contractTransactions.map((tx: any) => ({
        ...tx,
        transactionType: this.classifyTransaction(tx)
      }));

      // Apply pagination
      const total = classifiedTransactions.length;
      const paginatedTransactions = classifiedTransactions.slice(offset, offset + limit);
      const totalPages = Math.ceil(total / limit);

      return {
        transactions: paginatedTransactions,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error fetching wallet transactions from blockchain:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch blockchain transactions', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getContractInteractions(address: string): Promise<ContractInteraction[]> {
    try {
      const { transactions } = await this.getWalletTransactions(address, 1, 1000);
      
      const interactions: { [key: string]: ContractInteraction } = {};

      transactions.forEach((tx) => {
        const contractAddress = tx.to.toLowerCase();
        const contractName = this.getContractName(contractAddress);
        
        if (!interactions[contractAddress]) {
          interactions[contractAddress] = {
            contractAddress,
            contractName,
            transactionCount: 0,
            transactions: []
          };
        }
        
        interactions[contractAddress].transactionCount++;
        interactions[contractAddress].transactions.push(tx);
      });

      return Object.values(interactions);
    } catch (error) {
      logger.error('Error fetching contract interactions:', error);
      throw new CustomError('Failed to fetch contract interactions', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    try {
      const response = await axios.get(this.etherscanBaseUrl, {
        params: {
          module: 'account',
          action: 'balance',
          address: address.toLowerCase(),
          tag: 'latest',
          apikey: this.etherscanApiKey
        },
        timeout: 5000
      });

      if (response.data.status !== '1') {
        throw new CustomError('Failed to fetch balance from Etherscan', StatusCode.BAD_REQUEST);
      }

      // Convert from wei to ETH
      const balanceWei = response.data.result;
      const balanceEth = (parseInt(balanceWei) / Math.pow(10, 18)).toFixed(4);
      
      return balanceEth;
    } catch (error) {
      logger.error('Error fetching wallet balance:', error);
      return '0';
    }
  }

  private isContractInteraction(transaction: any): boolean {
    const toAddress = transaction.to?.toLowerCase();
    const fromAddress = transaction.from?.toLowerCase();
    
    const contractAddresses = Object.values(this.contractAddresses).map(addr => addr.toLowerCase());
    
    return contractAddresses.includes(toAddress) || contractAddresses.includes(fromAddress);
  }

  private classifyTransaction(transaction: any): string {
    const toAddress = transaction.to?.toLowerCase();
    const fromAddress = transaction.from?.toLowerCase();
    
    if (toAddress === this.contractAddresses.dex.toLowerCase() || fromAddress === this.contractAddresses.dex.toLowerCase()) {
      return 'DEX';
    }
    if (toAddress === this.contractAddresses.nftMarketplace.toLowerCase() || fromAddress === this.contractAddresses.nftMarketplace.toLowerCase()) {
      return 'NFT_MARKETPLACE';
    }
    if (toAddress === this.contractAddresses.coinA.toLowerCase() || fromAddress === this.contractAddresses.coinA.toLowerCase()) {
      return 'TOKEN_A';
    }
    if (toAddress === this.contractAddresses.coinB.toLowerCase() || fromAddress === this.contractAddresses.coinB.toLowerCase()) {
      return 'TOKEN_B';
    }
    
    return 'OTHER';
  }

  private getContractName(contractAddress: string): string {
    const lowerAddress = contractAddress.toLowerCase();
    
    if (lowerAddress === this.contractAddresses.dex.toLowerCase()) {
      return 'DEX Contract';
    }
    if (lowerAddress === this.contractAddresses.nftMarketplace.toLowerCase()) {
      return 'NFT Marketplace';
    }
    if (lowerAddress === this.contractAddresses.coinA.toLowerCase()) {
      return 'Token A';
    }
    if (lowerAddress === this.contractAddresses.coinB.toLowerCase()) {
      return 'Token B';
    }
    
    return 'Unknown Contract';
  }

  getEtherscanUrl(txHash: string): string {
    const baseUrl = process.env.ETHERSCAN_URL || 'https://sepolia.etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  }

  getAddressUrl(address: string): string {
    const baseUrl = process.env.ETHERSCAN_URL || 'https://sepolia.etherscan.io';
    return `${baseUrl}/address/${address}`;
  }
}