import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

// API service for chart data
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

interface TradingChartProps {
  fromToken?: string;
  toToken?: string;
}

// Define types for chart data
interface ChartDataPoint {
  timestamp: number;
  price?: number;
  close?: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
  date?: string;
}

// Sample trading data as fallback
const generateFallbackData = () => {
  const data = [];
  let price = 1200;
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    price += (Math.random() - 0.5) * 50;
    price = Math.max(price, 800);

    data.push({
      date: date.toLocaleDateString(),
      timestamp: date.getTime(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.random() * 1000000,
    });
  }

  return data;
};

const timeframes = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '7d' },
  { label: '1M', value: '1m' },
];

export default function TradingChart({ fromToken = 'ETH', toToken = 'CoinA' }: TradingChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [chartType, setChartType] = useState('area');
  const [priceData, setPriceData] = useState(generateFallbackData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchChartData = async (baseToken: string, quoteToken: string, timeframe: string) => {
    if (!baseToken || !quoteToken || baseToken === quoteToken) {
      setPriceData(generateFallbackData());
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/user/dex/chart?baseToken=${baseToken}&quoteToken=${quoteToken}&timeframe=${timeframe}&limit=100`
      );

      const result = await response.json();

      if (result.success && result.data?.data?.length > 0) {
        // Transform API data to match chart format
        const transformedData = result.data.data.map((item: ChartDataPoint) => ({
          date: new Date(item.timestamp).toLocaleDateString(),
          timestamp: item.timestamp,
          price: item.price || item.close || 0,
          volume: item.volume || 0,
          high: item.high || item.price || 0,
          low: item.low || item.price || 0,
          open: item.open || item.price || 0,
          close: item.close || item.price || 0,
        }));

        setPriceData(transformedData);
      } else {
        // Use fallback data if no real data available
        console.log('No chart data available, using fallback data');
        setPriceData(generateFallbackData());
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data');
      // Use fallback data on error
      setPriceData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(fromToken, toToken, selectedTimeframe);
  }, [fromToken, toToken, selectedTimeframe]);

  const currentPrice = priceData[priceData.length - 1]?.price || 0;
  const previousPrice = priceData[priceData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
          <p className="text-white/60 text-sm mb-1">{`Date: ${label}`}</p>
          <p className="text-white font-semibold">
            {`Price: ${payload[0].value?.toFixed(6)} ${toToken}`}
          </p>
          {payload[1] && (
            <p className="text-white/60 text-sm">
              {`Volume: ${(payload[1].value / 1000000).toFixed(2)}M`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                {currentPrice.toFixed(6)}
              </span>
              <span className="text-slate-400 text-lg">
                {fromToken}/{toToken}
              </span>
              <div className={`flex items-center space-x-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm">{fromToken}/{toToken} • 24h</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chart Type Selector */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 mr-2 border border-slate-700/50">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${chartType === 'area'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${chartType === 'line'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Line
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => setSelectedTimeframe(timeframe.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectedTimeframe === timeframe.value
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="h-64 flex items-center justify-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            ) : (
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 text-center border border-white/10">
          <p className="text-white/60 text-xs mb-1">24h High</p>
          <p className="font-semibold text-white text-sm">
            {Math.max(...priceData.map(d => d.price)).toFixed(6)}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">24h Low</p>
          <p className="font-semibold text-white text-sm">
            {Math.min(...priceData.map(d => d.price)).toFixed(6)}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Volume</p>
          <p className="font-semibold text-white text-sm">
            {(priceData.reduce((acc, d) => acc + d.volume, 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Trades</p>
          <p className="font-semibold text-white text-sm">{priceData.length}</p>
        </div>
      </div>
    </div>
  );
}