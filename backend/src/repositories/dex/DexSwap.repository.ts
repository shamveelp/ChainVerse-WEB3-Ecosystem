import { injectable } from "inversify";
import {
  IDexSwapRepository,
  ISwapFilters,
  IPagination,
  IChartData,
  ITradingStats,
  IVolumeData,
  IUserTradingStats,
  IDEXOverallStats
} from "../../core/interfaces/repositories/dex/IDexSwap.repository";
import { SwapTransactionModel, ISwapTransaction } from "../../models/dexSwap.model";
import { TokenPriceModel, ITokenPrice } from "../../models/tokenPrice.model";
import { TradingPairModel, ITradingPair } from "../../models/tradingPair.model";
import { FilterQuery, SortOrder } from "mongoose";

@injectable()
export class DexSwapRepository implements IDexSwapRepository {

  // Swap Transaction Methods
  async createSwapTransaction(swapData: Partial<ISwapTransaction>): Promise<ISwapTransaction> {
    const transaction = new SwapTransactionModel(swapData);
    return await transaction.save();
  }

  async updateSwapTransaction(txHash: string, updateData: Partial<ISwapTransaction>): Promise<ISwapTransaction | null> {
    return await SwapTransactionModel.findOneAndUpdate(
      { txHash },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async getSwapTransactionByHash(txHash: string): Promise<ISwapTransaction | null> {
    return await SwapTransactionModel.findOne({ txHash }).lean();
  }

  async getUserSwapHistory(userId: string, filters: ISwapFilters, pagination: IPagination): Promise<{
    transactions: ISwapTransaction[];
    total: number;
  }> {
    const query: FilterQuery<ISwapTransaction> = { userId };

    // Apply filters
    if (filters.walletAddress) query.walletAddress = filters.walletAddress;
    if (filters.fromToken) query.fromToken = filters.fromToken;
    if (filters.toToken) query.toToken = filters.toToken;
    if (filters.status) query.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      const timestampFilter: Record<string, Date> = {};
      if (filters.dateFrom) timestampFilter['$gte'] = new Date(filters.dateFrom);
      if (filters.dateTo) timestampFilter['$lte'] = new Date(filters.dateTo);
      query.timestamp = timestampFilter;
    }

    const sort: Record<string, SortOrder> = {};
    sort[pagination.sortBy || 'timestamp'] = pagination.sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      SwapTransactionModel.find(query)
        .sort(sort)
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
      SwapTransactionModel.countDocuments(query)
    ]);

    return { transactions, total };
  }

  async getSwapsByPair(fromToken: string, toToken: string, limit: number): Promise<ISwapTransaction[]> {
    return await SwapTransactionModel.find({
      $or: [
        { fromToken, toToken },
        { fromToken: toToken, toToken: fromToken }
      ],
      status: 'completed'
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async getRecentSwaps(limit: number): Promise<ISwapTransaction[]> {
    return await SwapTransactionModel.find({ status: 'completed' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username profilePic')
      .lean();
  }

  // Token Price Methods
  async createTokenPrice(priceData: Partial<ITokenPrice>): Promise<ITokenPrice> {
    const price = new TokenPriceModel(priceData);
    return await price.save();
  }

  async getLatestTokenPrice(token: string): Promise<ITokenPrice | null> {
    return await TokenPriceModel.findOne({ token })
      .sort({ timestamp: -1 })
      .lean();
  }

  async getTokenPriceHistory(token: string, fromDate: Date, toDate: Date): Promise<ITokenPrice[]> {
    return await TokenPriceModel.find({
      token,
      timestamp: { $gte: fromDate, $lte: toDate }
    })
      .sort({ timestamp: 1 })
      .lean();
  }

  async getTokenPricesForChart(
    baseToken: string,
    quoteToken: string,
    timeframe: string,
    limit: number
  ): Promise<IChartData[]> {
    const timeframeMap: { [key: string]: number } = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000
    };

    const intervalMs = timeframeMap[timeframe] || timeframeMap['1d'];
    const fromDate = new Date(Date.now() - (limit * intervalMs));

    // Get swap transactions for the pair
    const swaps = await SwapTransactionModel.find({
      $or: [
        { fromToken: baseToken, toToken: quoteToken },
        { fromToken: quoteToken, toToken: baseToken }
      ],
      status: 'completed',
      timestamp: { $gte: fromDate }
    })
      .sort({ timestamp: 1 })
      .lean();

    // Group swaps by time intervals
    const chartData: IChartData[] = [];
    const intervalStart = Math.floor(fromDate.getTime() / intervalMs) * intervalMs;

    for (let i = 0; i < limit; i++) {
      const periodStart = new Date(intervalStart + (i * intervalMs));
      const periodEnd = new Date(intervalStart + ((i + 1) * intervalMs));

      const periodSwaps = swaps.filter(swap => {
        const swapTime = new Date(swap.timestamp);
        return swapTime >= periodStart && swapTime < periodEnd;
      });

      let price = 0;
      let volume = 0;
      let high = 0;
      let low = Number.MAX_VALUE;
      let open = 0;
      let close = 0;

      if (periodSwaps.length > 0) {
        // Calculate OHLCV data
        open = this.calculatePrice(periodSwaps[0], baseToken, quoteToken);
        close = this.calculatePrice(periodSwaps[periodSwaps.length - 1], baseToken, quoteToken);

        periodSwaps.forEach((swap, index) => {
          const swapPrice = this.calculatePrice(swap, baseToken, quoteToken);
          const swapVolume = parseFloat(swap.fromToken === baseToken ? swap.actualFromAmount : swap.actualToAmount);

          volume += swapVolume;
          high = Math.max(high, swapPrice);
          low = Math.min(low, swapPrice);

          if (index === periodSwaps.length - 1) {
            price = swapPrice;
          }
        });
      } else {
        // Use previous period's closing price if no swaps
        if (chartData.length > 0) {
          const prevData = chartData[chartData.length - 1];
          price = prevData.close;
          open = prevData.close;
          close = prevData.close;
          high = prevData.close;
          low = prevData.close;
        }
      }

      chartData.push({
        timestamp: periodStart,
        price,
        volume,
        high: high === 0 ? price : high,
        low: low === Number.MAX_VALUE ? price : low,
        open,
        close
      });
    }

    return chartData;
  }

  private calculatePrice(swap: ISwapTransaction, baseToken: string, quoteToken: string): number {
    if (swap.fromToken === baseToken && swap.toToken === quoteToken) {
      return parseFloat(swap.actualToAmount) / parseFloat(swap.actualFromAmount);
    } else if (swap.fromToken === quoteToken && swap.toToken === baseToken) {
      return parseFloat(swap.actualFromAmount) / parseFloat(swap.actualToAmount);
    }
    return 0;
  }

  async updateTokenPrice(token: string, priceData: Partial<ITokenPrice>): Promise<ITokenPrice | null> {
    return await TokenPriceModel.findOneAndUpdate(
      { token },
      { ...priceData, timestamp: new Date() },
      { new: true, upsert: true }
    ).lean();
  }

  // Trading Pair Methods
  async createTradingPair(pairData: Partial<ITradingPair>): Promise<ITradingPair> {
    const pair = new TradingPairModel(pairData);
    return await pair.save();
  }

  async getTradingPair(baseToken: string, quoteToken: string): Promise<ITradingPair | null> {
    return await TradingPairModel.findOne({
      $or: [
        { baseToken, quoteToken },
        { baseToken: quoteToken, quoteToken: baseToken }
      ]
    }).lean();
  }

  async updateTradingPair(baseToken: string, quoteToken: string, updateData: Partial<ITradingPair>): Promise<ITradingPair | null> {
    return await TradingPairModel.findOneAndUpdate(
      {
        $or: [
          { baseToken, quoteToken },
          { baseToken: quoteToken, quoteToken: baseToken }
        ]
      },
      { ...updateData, updatedAt: new Date() },
      { new: true, upsert: true }
    ).lean();
  }

  async getAllTradingPairs(isActive?: boolean): Promise<ITradingPair[]> {
    const query = isActive !== undefined ? { isActive } : {};
    return await TradingPairModel.find(query)
      .sort({ volume24h: -1 })
      .lean();
  }

  async getTradingStats(): Promise<ITradingStats> {
    const [
      totalVolume24h,
      totalTrades,
      activePairs,
      topPairs
    ] = await Promise.all([
      TradingPairModel.aggregate([
        { $group: { _id: null, totalVolume: { $sum: '$volume24h' } } }
      ]),
      SwapTransactionModel.countDocuments({
        status: 'completed',
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      TradingPairModel.countDocuments({ isActive: true }),
      TradingPairModel.find({ isActive: true })
        .sort({ volume24h: -1 })
        .limit(5)
        .lean()
    ]);

    return {
      totalVolume24h: totalVolume24h[0]?.totalVolume || 0,
      totalTrades24h: totalTrades,
      activePairs,
      topPairs
    };
  }

  // Analytics Methods
  async getVolumeByTimeframe(timeframe: string): Promise<IVolumeData[]> {
    const timeframeMap: { [key: string]: string } = {
      '1h': '%Y-%m-%d %H:00:00',
      '1d': '%Y-%m-%d',
      '7d': '%Y-%W',
      '1m': '%Y-%m'
    };

    const dateFormat = timeframeMap[timeframe] || timeframeMap['1d'];

    return await SwapTransactionModel.aggregate([
      {
        $match: {
          status: 'completed',
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
          volume: { $sum: { $toDouble: '$actualFromAmount' } },
          trades: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getTopTradingPairs(limit: number): Promise<ITradingPair[]> {
    return await TradingPairModel.find({ isActive: true })
      .sort({ volume24h: -1 })
      .limit(limit)
      .lean();
  }

  async getUserTradingStats(userId: string): Promise<IUserTradingStats> {
    const [stats] = await SwapTransactionModel.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalVolume: { $sum: { $toDouble: '$actualFromAmount' } },
          totalFees: { $sum: { $toDouble: '$gasFee' } },
          avgSlippage: { $avg: '$slippage' },
          avgPriceImpact: { $avg: '$priceImpact' }
        }
      }
    ]);

    return stats || {
      totalTrades: 0,
      totalVolume: 0,
      totalFees: 0,
      avgSlippage: 0,
      avgPriceImpact: 0
    };
  }

  async getDEXOverallStats(): Promise<IDEXOverallStats> {
    const [
      totalStats,
      stats24h,
      uniqueUsers,
      totalLiquidity
    ] = await Promise.all([
      SwapTransactionModel.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalTrades: { $sum: 1 },
            totalVolume: { $sum: { $toDouble: '$actualFromAmount' } }
          }
        }
      ]),
      SwapTransactionModel.aggregate([
        {
          $match: {
            status: 'completed',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            trades24h: { $sum: 1 },
            volume24h: { $sum: { $toDouble: '$actualFromAmount' } }
          }
        }
      ]),
      SwapTransactionModel.distinct('userId', { status: 'completed' }),
      TradingPairModel.aggregate([
        { $group: { _id: null, totalLiquidity: { $sum: '$totalLiquidity' } } }
      ])
    ]);

    return {
      totalTrades: totalStats[0]?.totalTrades || 0,
      totalVolume: totalStats[0]?.totalVolume || 0,
      trades24h: stats24h[0]?.trades24h || 0,
      volume24h: stats24h[0]?.volume24h || 0,
      uniqueUsers: uniqueUsers.length,
      totalLiquidity: totalLiquidity[0]?.totalLiquidity || 0
    };
  }
}