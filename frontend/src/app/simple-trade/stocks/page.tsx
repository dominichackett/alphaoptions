'use client'
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const SimpleStockTradingScreen = () => {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  // Mock stock assets (simplified list)
  const stockAssets = [
    { 
      symbol: 'AAPL', 
      name: 'Apple Inc.', 
      price: 185.75, 
      change: +3.25, 
      changePercent: +1.78,
      volatility: 28.5,
    },
    { 
      symbol: 'TSLA', 
      name: 'Tesla Inc.', 
      price: 248.50, 
      change: +12.75, 
      changePercent: +5.41,
      volatility: 45.8,
    },
  ];

  // Mock price chart data (simplified)
  const priceData = [
    { time: '9:30', price: 182.50 },
    { time: '12:00', price: 183.75 },
    { time: '16:00', price: 184.20 },
    { time: '18:00', price: 184.85 },
    { time: '22:00', price: 185.15 },
    { time: '02:00', price: 185.75 },
  ];

  // Mock expiry dates (simplified)
  const expiryDates = [
    { date: '2024-08-30', label: '1 Month' },
    { date: '2024-09-27', label: '2 Months' },
  ];

  // Mock options chain data (simplified)
  const optionsChain = {
    'AAPL': [
      { type: 'call', strike: 185, bid: 4.85, ask: 5.35, last: 5.10 },
      { type: 'call', strike: 190, bid: 2.15, ask: 2.65, last: 2.40 },
      { type: 'put', strike: 185, bid: 5.75, ask: 6.25, last: 6.00 },
      { type: 'put', strike: 180, bid: 2.85, ask: 3.35, last: 3.10 },
    ],
    'TSLA': [
      { type: 'call', strike: 250, bid: 6.80, ask: 7.00, last: 6.90 },
      { type: 'call', strike: 260, bid: 3.20, ask: 3.40, last: 3.30 },
      { type: 'put', strike: 250, bid: 5.00, ask: 5.20, last: 5.10 },
      { type: 'put', strike: 240, bid: 2.50, ask: 2.70, last: 2.60 },
    ],
  };

  const currentAsset = stockAssets.find(asset => asset.symbol === selectedAsset);
  const availableOptions = optionsChain[selectedAsset] || [];

  useEffect(() => {
    setSelectedOption(null);
    setShowOrderPanel(false);
  }, [selectedAsset, selectedExpiry]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowOrderPanel(true);
  };

  const calculatePnL = (strike, type, premium, spotPrice) => {
    if (type === 'call') {
      const intrinsic = Math.max(0, spotPrice - strike);
      return intrinsic - premium;
    } else {
      const intrinsic = Math.max(0, strike - spotPrice);
      return intrinsic - premium;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      <OptionsHeader />
      
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Simple Stock Options
              </h1>
              <p className="text-gray-400 mt-1">
                Trade popular stock options with ease
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-purple-300 text-sm font-medium">24/7 Synthetic Trading</span>
            </div>
          </div>

          {/* Asset Selector */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Select Stock Asset</h2>
            <div className="flex flex-wrap gap-4">
              {stockAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedAsset === asset.symbol
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{asset.symbol}</span>
                      <span className="text-xs text-gray-400">{asset.name}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">${asset.price.toFixed(2)}</div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">{selectedAsset} Price Chart</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="stockPriceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#stockPriceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simplified Option Chain */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Available Options (Calls)</h2>
            <div className="mb-4">
              <label htmlFor="expiry-select" className="block text-sm text-gray-400 mb-2">Select Expiry:</label>
              <select
                id="expiry-select"
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
              >
                {expiryDates.map((expiry) => (
                  <option key={expiry.date} value={expiry.date}>
                    {expiry.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-600 text-gray-200 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Strike</th>
                    <th className="py-3 px-6 text-left">Bid</th>
                    <th className="py-3 px-6 text-left">Ask</th>
                    <th className="py-3 px-6 text-left">Last</th>
                    <th className="py-3 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 text-sm font-light">
                  {availableOptions.length > 0 ? (
                    availableOptions.map((option, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-600 hover:bg-gray-600 ${selectedOption === option ? 'bg-blue-900/50' : ''}`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <td className="py-3 px-6 text-left">${option.strike}</td>
                        <td className="py-3 px-6 text-left">${option.bid.toFixed(2)}</td>
                        <td className="py-3 px-6 text-left">${option.ask.toFixed(2)}</td>
                        <td className="py-3 px-6 text-left">${option.last.toFixed(2)}</td>
                        <td className="py-3 px-6 text-center">
                          <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                            onClick={() => handleOptionSelect(option)}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-400">No options available for this asset.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Panel */}
          {showOrderPanel && selectedOption && currentAsset && (
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Place Order</h3>
                <button 
                  onClick={() => setShowOrderPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {selectedAsset} ${selectedOption.strike} {selectedOption.type.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400">
                      Exp: {selectedExpiry} • Contracts: 100 shares each
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-white"
                    min="1"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium per Contract:</span>
                    <span className="text-white font-medium">${selectedOption.ask.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white font-medium">${(selectedOption.ask * quantity * 100).toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-medium">
                  Buy {selectedOption.type.toUpperCase()} • ${(selectedOption.ask * quantity * 100).toFixed(2)}
                </button>
              </div>
            </div>
          )}

          {/* P&L Calculator */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Profit/Loss Scenarios</h3>
            
            {selectedOption && currentAsset && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Stock Price at Expiry
                  </label>
                  <input
                    type="range"
                    min={currentAsset.price * 0.8}
                    max={currentAsset.price * 1.2}
                    step="1"
                    defaultValue={currentAsset.price}
                    className="w-full"
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      const pnl = calculatePnL(selectedOption.strike, selectedOption.type, selectedOption.ask, price) * quantity * 100;
                      e.target.nextElementSibling.textContent = `${price.toFixed(2)}`;
                      e.target.parentElement.nextElementSibling.children[1].textContent = 
                        `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;
                      e.target.parentElement.nextElementSibling.children[1].className = 
                        `font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
                    }}
                  />
                  <div className="text-center text-white font-medium mt-1">
                    ${currentAsset.price.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated P&L:</span>
                    <span className="text-white font-bold text-lg">$0.00</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  💡 Drag slider to see P&L at different stock price levels
                </div>
              </div>
            )}
            
            {!selectedOption && (
              <div className="text-center text-gray-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                <p>Select an option to see profit scenarios</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleStockTradingScreen;
