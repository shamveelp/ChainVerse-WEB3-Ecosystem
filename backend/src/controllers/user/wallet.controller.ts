import { Request, Response } from 'express';
import Wallet from '../../models/wallet.model';

interface WalletRequest extends Request {
  body: { address: string };
}

export const createWallet = async (req: WalletRequest, res: Response): Promise<void> => {
  try {
    const { address } = req.body;

    let wallet = await Wallet.findOne({ address });

    if (wallet) {
      wallet.lastConnected = new Date();
      wallet.connectionCount += 1;
      await wallet.save();
      res.status(200).json(wallet);
      return;
    }

    wallet = new Wallet({
      address,
      lastConnected: new Date(),
    });

    await wallet.save();
    res.status(201).json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: 'Error saving wallet', details: error.message });
  }
};

export const getWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address });
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    res.status(200).json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching wallet', details: error.message });
  }
};