import { inject, injectable } from "inversify";
import { IWalletService } from "../../core/interfaces/services/dex/IWalletService";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { TYPES } from "../../core/types/types";
import { IWallet } from "../../models/wallet.model";
import { CustomError } from "../../utils/CustomError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class WalletService implements IWalletService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

  async connectWallet(address: string): Promise<IWallet> {
    try {
      if (!this.validateWalletAddress(address)) {
        throw new CustomError("Invalid wallet address format", StatusCode.BAD_REQUEST);
      }

      // Check if wallet already exists
      let wallet = await this._dexRepository.findWalletByAddress(address);
      
      if (wallet) {
        // Update existing wallet connection
        wallet = await this._dexRepository.updateWalletConnection(address);
        logger.info(`Wallet reconnected: ${address}`);
        return wallet!;
      } else {
        // Create new wallet entry
        wallet = await this._dexRepository.createWallet({
          address,
          lastConnected: new Date(),
          connectionCount: 1,
        });
        logger.info(`New wallet connected: ${address}`);
        return wallet;
      }
    } catch (error) {
      logger.error("Error connecting wallet:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to connect wallet", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async disconnectWallet(address: string): Promise<void> {
    try {
      const wallet = await this._dexRepository.findWalletByAddress(address);
      if (!wallet) {
        throw new CustomError("Wallet not found", StatusCode.NOT_FOUND);
      }
      
      // Update last connected time
      await this._dexRepository.updateWalletConnection(address);
      logger.info(`Wallet disconnected: ${address}`);
    } catch (error) {
      logger.error("Error disconnecting wallet:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to disconnect wallet", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletInfo(address: string): Promise<IWallet | null> {
    try {
      return await this._dexRepository.findWalletByAddress(address);
    } catch (error) {
      logger.error("Error getting wallet info:", error);
      throw new CustomError("Failed to get wallet information", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateWalletConnection(address: string): Promise<IWallet> {
    try {
      const wallet = await this._dexRepository.updateWalletConnection(address);
      if (!wallet) {
        throw new CustomError("Wallet not found", StatusCode.NOT_FOUND);
      }
      return wallet;
    } catch (error) {
      logger.error("Error updating wallet connection:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to update wallet connection", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  validateWalletAddress(address: string): boolean {
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }
}