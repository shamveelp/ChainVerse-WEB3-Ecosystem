'use client';

import { useState } from 'react';
import { CreditCard, DollarSign, ArrowRight, Shield, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import Link from 'next/link';
import { COMMON_ROUTES } from '@/routes';

export default function BuyCryptoInterface() {
  const account = useActiveAccount();
  const { user } = useSelector((state: RootState) => state.userAuth);

  const [buyForm, setBuyForm] = useState({
    fiatCurrency: 'INR',
    fiatAmount: '',
    cryptoCurrency: 'ETH',
    paymentMethod: 'card'
  });

  const paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, fees: '2.5%' },
    { id: 'upi', label: 'UPI Payment', icon: DollarSign, fees: '0.5%' },
  ];

  const cryptoOptions = [
    { symbol: 'ETH', name: 'Sepolia ETH', price: '₹200,000' },
  ];

  const estimatedEth = buyForm.fiatAmount ? (parseFloat(buyForm.fiatAmount) / 200000).toFixed(6) : '0.000000';
  const processingFee = buyForm.fiatAmount ? (parseFloat(buyForm.fiatAmount) * 0.05).toFixed(2) : '0.00';
  const networkFee = buyForm.fiatAmount ? (parseFloat(buyForm.fiatAmount) * 0.15).toFixed(2) : '0.00';
  const totalCost = buyForm.fiatAmount ? (parseFloat(buyForm.fiatAmount) * 1.20).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Buy Crypto Form */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-400" />
            Buy Cryptocurrency
          </h2>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Shield className="h-4 w-4" />
            <span>Secure & Protected</span>
          </div>
        </div>

        {!user && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center space-x-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-yellow-300 text-sm">Please login to buy crypto</p>
          </div>
        )}

        {!account?.address && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-blue-400" />
            <p className="text-blue-300 text-sm">Please connect your wallet to buy crypto</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Currency Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Currency</label>
            <select
              className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none"
              value={buyForm.fiatCurrency}
              onChange={(e) => setBuyForm(prev => ({ ...prev, fiatCurrency: e.target.value }))}
            >
              <option value="INR" className="bg-slate-800">Indian Rupee (₹)</option>
              <option value="USD" className="bg-slate-800" disabled>US Dollar ($) - Coming Soon</option>
              <option value="EUR" className="bg-slate-800" disabled>Euro (€) - Coming Soon</option>
            </select>
          </div>

          {/* Fiat Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Amount in {buyForm.fiatCurrency === 'INR' ? 'Indian Rupee' : 'USD'}
            </label>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 text-lg">
                  {buyForm.fiatCurrency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  type="number"
                  placeholder="100.00"
                  className="flex-1 bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={buyForm.fiatAmount}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, fiatAmount: e.target.value }))}
                  min="100"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">Minimum: ₹100</p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <ArrowRight className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Crypto Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">You Get</label>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center space-x-3">
                <select
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm min-w-[90px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none"
                  value={buyForm.cryptoCurrency}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, cryptoCurrency: e.target.value }))}
                >
                  {cryptoOptions.map(crypto => (
                    <option key={crypto.symbol} value={crypto.symbol} className="bg-slate-800">
                      {crypto.symbol}
                    </option>
                  ))}
                </select>
                <div className="flex-1 text-xl text-white">
                  {estimatedEth}
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-400">
                ≈ ₹{buyForm.fiatAmount || '0.00'} INR
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Payment Method</label>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    onClick={() => setBuyForm(prev => ({ ...prev, paymentMethod: method.id }))}
                    className={`
                      p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${buyForm.paymentMethod === method.id
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:border-slate-600/50 hover:bg-slate-700/30'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{method.label}</span>
                      </div>
                      <div className="text-sm opacity-75">
                        Fee: {method.fees}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Summary */}
          {buyForm.fiatAmount && (
            <div className="bg-slate-800/20 rounded-xl p-4 space-y-2 text-sm border border-slate-700/30">
              <h4 className="font-semibold text-white mb-2">Transaction Summary</h4>
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className="text-white">₹{buyForm.fiatAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Fee (5%):</span>
                <span className="text-white">₹{processingFee}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Other Fees (15%):</span>
                <span className="text-white">₹{networkFee}</span>
              </div>
              <div className="border-t border-slate-700/50 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-300">You'll Receive:</span>
                  <span className="text-cyan-400">{(parseFloat(estimatedEth) * 0.8).toFixed(6)} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Buy Button */}
          <Link
            href={COMMON_ROUTES.BUY}
            className="block w-full"
          >
            <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-[1.02]">
              <ExternalLink className="h-5 w-5" />
              <span>Go to Full Buy Interface</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Payment Protection Info */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-emerald-400" />
          Why Choose ChainVerse?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white text-sm mb-1">Secure</h4>
            <p className="text-slate-400 text-xs">Razorpay integration with 256-bit SSL</p>
          </div>
          <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white text-sm mb-1">Fast</h4>
            <p className="text-slate-400 text-xs">Crypto delivered within 24 hours</p>
          </div>
          <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <CreditCard className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white text-sm mb-1">Trusted</h4>
            <p className="text-slate-400 text-xs">Licensed and compliant</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <p className="text-blue-300 text-sm">
              <strong>Important:</strong> This is for Sepolia testnet ETH only. Perfect for testing DApps and smart contracts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}