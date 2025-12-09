import { Request, Response } from 'express';
import { WalletService } from '../../services/dex/Wallet.service';
import { ErrorMessages } from '../../enums/messages.enum';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  /**
   * Saves a wallet address.
   * @param req - Express Request object containing address in body.
   * @param res - Express Response object.
   */
  async saveWallet(req: Request, res: Response) {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ error: ErrorMessages.WALLET_ADDRESS_REQUIRED });
      }
      const wallet = await this.walletService.saveWallet(address);
      res.status(201).json(wallet);
    } catch (error) {
      res.status(500).json({ error: ErrorMessages.SERVER_ERROR });
    }
  }
}