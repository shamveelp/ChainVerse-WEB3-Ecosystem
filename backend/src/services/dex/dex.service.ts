import { inject, injectable } from "inversify";
import { IDexService } from "../../core/interfaces/services/dex/IDexService";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { TYPES } from "../../core/types/types";
import { ITransaction } from "../../models/transactions.model";
import { ICoin } from "../../models/coins.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class DexService implements IDexService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

  async executeSwap(swapData: {
    walletAddress: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    transactionHash: string;
    network?: string;
  }): Promise<ITransaction> {
    try {
      // Validate swap parameters
      await this.validateSwapParameters(swapData.fromToken, swapData.toToken, swapData.fromAmount);

      // Check if transaction already exists
      const existingTx = await this._dexRepository.findTransactionByHash(swapData.transactionHash);
      if (existingTx) {
        throw new CustomError("Transaction already exists", StatusCode.BAD_REQUEST);
      }

      // Create transaction record
      const transaction = await this._dexRepository.createTransaction({
        ...swapData,
        network: swapData.network || 'sepolia',
        status: 'pending',
        timestamp: new Date(),
      });

      logger.info(`Swap transaction created: ${swapData.transactionHash}`);
      return transaction;
    } catch (error) {
      logger.error("Error executing swap:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to execute swap", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getSwapQuote(fromToken: string, toToken: string, amount: string): Promise<{
    toAmount: string;
    priceImpact: number;
    slippage: number;
  }> {
    try {
      // This would integrate with your smart contract to get real quotes
      // For now, returning a mock calculation
      const mockToAmount = (parseFloat(amount) * 0.95).toString(); // 5% slippage
      
      return {
        toAmount: mockToAmount,
        priceImpact: 2.5,
        slippage: 0.5,
      };
    } catch (error) {
      logger.error("Error getting swap quote:", error);
      throw new CustomError("Failed to get swap quote", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTransactionHistory(walletAddress: string, page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }> {
    try {
      return await this._dexRepository.getTransactionsByWallet(walletAddress, page, limit);
    } catch (error) {
      logger.error("Error getting transaction history:", error);
      throw new CustomError("Failed to get transaction history", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTransactionDetails(hash: string): Promise<ITransaction | null> {
    try {
      return await this._dexRepository.findTransactionByHash(hash);
    } catch (error) {
      logger.error("Error getting transaction details:", error);
      throw new CustomError("Failed to get transaction details", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getAvailablePairs(): Promise<Array<{ token0: ICoin, token1: ICoin }>> {
    try {
      const coins = await this._dexRepository.getListedCoins();
      const pairs: Array<{ token0: ICoin, token1: ICoin }> = [];
      
      // Create all possible pairs (excluding self-pairs)
      for (let i = 0; i < coins.length; i++) {
        for (let j = i + 1; j < coins.length; j++) {
          pairs.push({ token0: coins[i], token1: coins[j] });
        }
      }
      
      return pairs;
    } catch (error) {
      logger.error("Error getting available pairs:", error);
      throw new CustomError("Failed to get available pairs", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateTransactionStatus(hash: string, status: 'completed' | 'failed', additionalData?: any): Promise<ITransaction> {
    try {
      const transaction = await this._dexRepository.updateTransactionStatus(hash, status, additionalData);
      if (!transaction) {
        throw new CustomError("Transaction not found", StatusCode.NOT_FOUND);
      }
      
      logger.info(`Transaction status updated: ${hash} -> ${status}`);
      return transaction;
    } catch (error) {
      logger.error("Error updating transaction status:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to update transaction status", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async validateSwapParameters(fromToken: string, toToken: string, amount: string): Promise<boolean> {
    try {
      if (!fromToken || !toToken || !amount) {
        throw new CustomError("Missing required swap parameters", StatusCode.BAD_REQUEST);
      }

      if (fromToken === toToken) {
        throw new CustomError("Cannot swap token with itself", StatusCode.BAD_REQUEST);
      }

      if (parseFloat(amount) <= 0) {
        throw new CustomError("Amount must be greater than zero", StatusCode.BAD_REQUEST);
      }

      // Validate tokens exist (unless it's ETH)
      if (fromToken !== 'ETH') {
        const fromCoin = await this._dexRepository.findCoinByAddress(fromToken);
        if (!fromCoin || !fromCoin.isListed) {
          throw new CustomError("From token not found or not listed", StatusCode.BAD_REQUEST);
        }
      }

      if (toToken !== 'ETH') {
        const toCoin = await this._dexRepository.findCoinByAddress(toToken);
        if (!toCoin || !toCoin.isListed) {
          throw new CustomError("To token not found or not listed", StatusCode.BAD_REQUEST);
        }
      }

      return true;
    } catch (error) {
      logger.error("Error validating swap parameters:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Invalid swap parameters", StatusCode.BAD_REQUEST);
    }
  }
}