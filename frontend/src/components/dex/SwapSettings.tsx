'use client';

import { useState } from 'react';
import { X, TriangleAlert as AlertTriangle, Zap, Clock, Settings } from 'lucide-react';

interface SwapSettingsProps {
  settings: {
    slippage: string;
    deadline: string;
    expertMode: boolean;
    gasPrice: string;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

export default function SwapSettings({ settings, onSettingsChange, onClose }: SwapSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const slippagePresets = ['0.1', '0.5', '1', '2', '5'];
  const gasPresets = [
    { label: 'Slow', value: 'slow', desc: 'Lower fees', icon: '🐌' },
    { label: 'Standard', value: 'standard', desc: 'Recommended', icon: '⚡' },
    { label: 'Fast', value: 'fast', desc: 'Higher fees', icon: '🚀' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Swap Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800/50 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Slippage Tolerance */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <label className="text-sm font-bold text-white">Slippage Tolerance</label>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {slippagePresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setLocalSettings(prev => ({ ...prev, slippage: preset }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    localSettings.slippage === preset
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={localSettings.slippage}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, slippage: e.target.value }))}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="0.01"
                max="50"
                step="0.01"
              />
              <span className="text-slate-400 text-sm">%</span>
            </div>
            
            {parseFloat(localSettings.slippage) > 5 && (
              <p className="text-amber-400 text-xs mt-2 flex items-center bg-amber-400/10 rounded-lg p-2 border border-amber-400/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High slippage may result in unfavorable trades
              </p>
            )}
          </div>

          {/* Transaction Deadline */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-blue-400" />
              <label className="text-sm font-bold text-white">Transaction Deadline</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={localSettings.deadline}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, deadline: e.target.value }))}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                max="120"
              />
              <span className="text-slate-400 text-sm">minutes</span>
            </div>
          </div>

          {/* Gas Price */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-4 w-4 text-yellow-400" />
              <label className="text-sm font-bold text-white">Gas Price</label>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {gasPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setLocalSettings(prev => ({ ...prev, gasPrice: preset.value }))}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                    localSettings.gasPrice === preset.value
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:border-slate-600/50 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="text-lg mb-1">{preset.icon}</div>
                  <div className="font-medium text-xs">{preset.label}</div>
                  <div className="text-xs opacity-75">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Expert Mode */}
          <div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <label className="text-sm font-bold text-white">Expert Mode</label>
                </div>
                <p className="text-xs text-slate-400">
                  Allows high slippage trades. Use at your own risk.
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.expertMode}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, expertMode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800/50 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-slate-700/50">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-white py-3 rounded-lg font-medium transition-all duration-200 border border-slate-700/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg font-medium transition-all duration-200"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}