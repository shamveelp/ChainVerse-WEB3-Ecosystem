import { injectable } from "inversify";
import axios from "axios";
import logger from "../utils/logger";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";

export interface EtherscanTransaction {
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
  input: string;
  contractAddress: string;
  functionName?: string;
  methodId?: string;
}

@injectable()
export class EtherscanService {
  private readonly baseUrl = process.env.ETHERSCAN_BASE_URL || "https://api-sepolia.etherscan.io/api";
  private readonly apiKey = process.env.ETHERSCAN_API_KEY;
  private readonly contractAddresses: string[];

  constructor() {
    if (!this.apiKey) {
      logger.warn("Etherscan API key not provided");
    }

    // Parse contract addresses from environment variable
    const contractAddressesEnv = process.env.CONTRACT_ADDRESSES || "";
    this.contractAddresses = contractAddressesEnv
      .split(",")
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr.length > 0);

    logger.info(`Loaded ${this.contractAddresses.length} contract addresses for filtering`);
  }

  async getWalletTransactions(
    address: string,
    page: number = 1,
    limit: number = 20,
    filterAppOnly: boolean = false
  ): Promise<{
    transactions: EtherscanTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!this.apiKey) {
        throw new CustomError("Etherscan API key not configured", StatusCode.SERVICE_UNAVAILABLE);
      }

      // Calculate offset for pagination
      const offset = limit;
      const startblock = 0;
      const endblock = 99999999;
      const sort = "desc";

      // Fetch transactions from Etherscan
      const response = await axios.get(this.baseUrl, {
        params: {
          module: "account",
          action: "txlist",
          address: address,
          startblock,
          endblock,
          page,
          offset,
          sort,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== "1") {
        logger.warn(`Etherscan API error for ${address}:`, response.data.message);
        return {
          transactions: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      let transactions: EtherscanTransaction[] = response.data.result || [];

      // Filter for app-specific transactions if requested
      if (filterAppOnly && this.contractAddresses.length > 0) {
        transactions = transactions.filter(tx => 
          this.contractAddresses.includes(tx.to?.toLowerCase()) ||
          this.contractAddresses.includes(tx.from?.toLowerCase()) ||
          (tx.contractAddress && this.contractAddresses.includes(tx.contractAddress.toLowerCase()))
        );
      }

      // Add additional transaction details
      transactions = transactions.map(tx => ({
        ...tx,
        functionName: this.extractFunctionName(tx.input),
        methodId: tx.input?.substring(0, 10) || "",
      }));

      // Since Etherscan doesn't provide total count, we estimate based on results
      const total = transactions.length === limit ? transactions.length * 10 : transactions.length + (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${transactions.length} transactions for wallet ${address} (page ${page})`);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("Error fetching wallet transactions from Etherscan:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new CustomError("Request timeout while fetching wallet history", StatusCode.REQUEST_TIMEOUT);
        }
        if (error.response?.status === 429) {
          throw new CustomError("Rate limit exceeded for Etherscan API", StatusCode.TOO_MANY_REQUESTS);
        }
      }

      throw new CustomError("Failed to fetch wallet transactions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    try {
      if (!this.apiKey) {
        return "0";
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          module: "account",
          action: "balance",
          address: address,
          tag: "latest",
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      if (response.data.status === "1") {
        return response.data.result;
      }

      return "0";
    } catch (error) {
      logger.error("Error fetching wallet balance:", error);
      return "0";
    }
  }

  private extractFunctionName(input: string): string {
    if (!input || input === "0x") return "";
    
    // Common function signatures
    const functionSignatures: { [key: string]: string } = {
      "0xa9059cbb": "transfer",
      "0x23b872dd": "transferFrom",
      "0x095ea7b3": "approve",
      "0x18160ddd": "totalSupply",
      "0x70a08231": "balanceOf",
      "0xdd62ed3e": "allowance",
      "0x40c10f19": "mint",
      "0x42966c68": "burn",
      "0x7ff36ab5": "swapExactETHForTokens",
      "0x38ed1739": "swapExactTokensForTokens",
      "0x8803dbee": "swapTokensForExactTokens",
    };

    const methodId = input.substring(0, 10);
    return functionSignatures[methodId] || methodId;
  }

  getContractAddresses(): string[] {
    return this.contractAddresses;
  }

  isAppTransaction(transaction: EtherscanTransaction): boolean {
    if (this.contractAddresses.length === 0) return false;

    return this.contractAddresses.includes(transaction.to?.toLowerCase()) as boolean ||
           this.contractAddresses.includes(transaction.from?.toLowerCase()) as boolean ||
           (transaction.contractAddress && this.contractAddresses.includes(transaction.contractAddress.toLowerCase())) as boolean;
  }
}