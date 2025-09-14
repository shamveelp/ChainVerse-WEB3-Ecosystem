import express from 'express';
import { WalletController } from '../controllers/dex/wallet.controller';

const router = express.Router();
const walletController = new WalletController();

router.post('/wallets', (req, res) => walletController.saveWallet(req, res));

export default router;