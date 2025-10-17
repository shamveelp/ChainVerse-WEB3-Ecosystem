'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Sample trading data
const generatePriceData = () => {
  const data = [];
  let price = 1200;
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate price movement
    price += (Math.random() - 0.5) * 50;
    price = Math.max(price, 800); // Keep price reasonable
    
    data.push({
      date: date.toLocaleDateString(),
      timestamp: date.getTime(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.random() * 1000000,
    });
  }
  
  return data;
};

const priceData = generatePriceData();

const timeframes = [
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
];

export default function TradingChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [chartType, setChartType] = useState('area');

  const currentPrice = priceData[priceData.length - 1]?.price || 0;
  const previousPrice = priceData[priceData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
          <p className="text-white/60 text-sm mb-1">{`Date: ${label}`}</p>
          <p className="text-white font-semibold">
            {`Price: $${payload[0].value?.toFixed(2)}`}
          </p>
          {payload[1] && (
            <p className="text-white/60 text-sm">
              {`Volume: $${(payload[1].value / 1000000).toFixed(2)}M`}
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
                ${currentPrice.toFixed(2)}
              </span>
              <div className={`flex items-center space-x-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm">ETH/USD • 24h</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chart Type Selector */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 mr-2 border border-slate-700/50">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'area' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line' 
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
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe.value 
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

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
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
                domain={['dataMin - 50', 'dataMax + 50']}
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
                domain={['dataMin - 50', 'dataMax + 50']}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 text-center border border-white/10">
          <p className="text-white/60 text-xs mb-1">24h High</p>
          <p className="font-semibold text-white text-sm">
            ${Math.max(...priceData.map(d => d.price)).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">24h Low</p>
          <p className="font-semibold text-white text-sm">
            ${Math.min(...priceData.map(d => d.price)).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Volume</p>
          <p className="font-semibold text-white text-sm">
            ${(priceData.reduce((acc, d) => acc + d.volume, 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Market Cap</p>
          <p className="font-semibold text-white text-sm">$4.8B</p>
        </div>
      </div>
    </div>
  );
}