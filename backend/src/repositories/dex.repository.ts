import { injectable } from "inversify";
import { IDexRepository } from "../core/interfaces/repositories/IDexRepository";
import Wallet, { IWallet } from "../models/wallet.model";
import Transaction, { ITransaction } from "../models/transactions.model";
import Coin, { ICoin } from "../models/coins.model";

@injectable()
export class DexRepository implements IDexRepository {
  
  // Wallet operations
  async createWallet(walletData: Partial<IWallet>): Promise<IWallet> {
    const wallet = new Wallet(walletData);
    return await wallet.save();
  }

  async findWalletByAddress(address: string): Promise<IWallet | null> {
    return await Wallet.findOne({ address });
  }

  async updateWalletConnection(address: string): Promise<IWallet | null> {
    return await Wallet.findOneAndUpdate(
      { address },
      { 
        lastConnected: new Date(),
        $inc: { connectionCount: 1 }
      },
      { new: true }
    );
  }

  async getAllWallets(page: number = 1, limit: number = 20): Promise<{ wallets: IWallet[], total: number }> {
    const skip = (page - 1) * limit;
    const [wallets, total] = await Promise.all([
      Wallet.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Wallet.countDocuments()
    ]);
    return { wallets, total };
  }

  async getWalletStats(): Promise<{
    totalWallets: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalWallets, activeToday, activeThisWeek, activeThisMonth] = await Promise.all([
      Wallet.countDocuments(),
      Wallet.countDocuments({ lastConnected: { $gte: today } }),
      Wallet.countDocuments({ lastConnected: { $gte: thisWeek } }),
      Wallet.countDocuments({ lastConnected: { $gte: thisMonth } })
    ]);

    return { totalWallets, activeToday, activeThisWeek, activeThisMonth };
  }

  // Transaction operations
  async createTransaction(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    const transaction = new Transaction(transactionData);
    return await transaction.save();
  }

  async findTransactionByHash(hash: string): Promise<ITransaction | null> {
    return await Transaction.findOne({ transactionHash: hash });
  }

  async updateTransactionStatus(hash: string, status: 'completed' | 'failed', additionalData?: any): Promise<ITransaction | null> {
    const updateData: any = { status, updatedAt: new Date() };
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }
    return await Transaction.findOneAndUpdate(
      { transactionHash: hash },
      updateData,
      { new: true }
    );
  }

  async getTransactionsByWallet(walletAddress: string, page: number = 1, limit: number = 20): Promise<{ transactions: ITransaction[], total: number }> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find({ walletAddress }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments({ walletAddress })
    ]);
    return { transactions, total };
  }

  async getAllTransactions(page: number = 1, limit: number = 20): Promise<{ transactions: ITransaction[], total: number }> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments()
    ]);
    return { transactions, total };
  }

  async getTransactionStats(): Promise<{
    totalTransactions: number;
    todayVolume: string;
    weeklyVolume: string;
    monthlyVolume: string;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalTransactions, todayTxs, weeklyTxs, monthlyTxs] = await Promise.all([
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.find({ createdAt: { $gte: today }, status: 'completed' }),
      Transaction.find({ createdAt: { $gte: thisWeek }, status: 'completed' }),
      Transaction.find({ createdAt: { $gte: thisMonth }, status: 'completed' })
    ]);

    const calculateVolume = (txs: ITransaction[]) => {
      return txs.reduce((total, tx) => {
        return total + parseFloat(tx.fromAmount || "0");
      }, 0).toString();
    };

    return {
      totalTransactions,
      todayVolume: calculateVolume(todayTxs),
      weeklyVolume: calculateVolume(weeklyTxs),
      monthlyVolume: calculateVolume(monthlyTxs)
    };
  }

  // Coin operations
  async createCoin(coinData: Partial<ICoin>): Promise<ICoin> {
    const coin = new Coin(coinData);
    return await coin.save();
  }

  async findCoinByAddress(contractAddress: string): Promise<ICoin | null> {
    return await Coin.findOne({ contractAddress });
  }

  async findCoinBySymbol(symbol: string): Promise<ICoin | null> {
    return await Coin.findOne({ symbol: symbol.toUpperCase() });
  }

  async updateCoin(contractAddress: string, updateData: Partial<ICoin>): Promise<ICoin | null> {
    return await Coin.findOneAndUpdate(
      { contractAddress },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
  }

  async getAllCoins(includeUnlisted: boolean = false): Promise<ICoin[]> {
    const filter = includeUnlisted ? {} : { isListed: true };
    return await Coin.find(filter).sort({ createdAt: -1 });
  }

  async getListedCoins(): Promise<ICoin[]> {
    return await Coin.find({ isListed: true }).sort({ createdAt: -1 });
  }

  async toggleCoinListing(contractAddress: string, isListed: boolean): Promise<ICoin | null> {
    return await Coin.findOneAndUpdate(
      { contractAddress },
      { isListed, updatedAt: new Date() },
      { new: true }
    );
  }

  async deleteCoin(contractAddress: string): Promise<boolean> {
    const result = await Coin.deleteOne({ contractAddress });
    return result.deletedCount > 0;
  }
}