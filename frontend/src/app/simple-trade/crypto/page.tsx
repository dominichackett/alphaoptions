'use client'
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const SimpleCryptoTradingScreen = () => {
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  // Mock crypto assets (simplified list)
  const cryptoAssets = [
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      price: 3245.67, 
      change: +125.43, 
      changePercent: +4.02,
      volatility: 68.5,
    },
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      price: 67850.25, 
      change: +2150.75, 
      changePercent: +3.27,
      volatility: 58.2,
    },
  ];

  // Mock price chart data (simplified)
  const priceData = [
    { time: '00:00', price: 3120 },
    { time: '04:00', price: 3145 },
    { time: '08:00', price: 3089 },
    { time: '12:00', price: 3178 },
    { time: '16:00', price: 3205 },
    { time: '20:00', price: 3245 },
  ];

  // Mock expiry dates (simplified)
  const expiryDates = [
    { date: '2024-08-30', label: '1 Month' },
    { date: '2024-09-27', label: '2 Months' },
  ];

  // Mock options chain data (simplified)
  const optionsChain = {
    'ETH': [
      { type: 'call', strike: 3200, bid: 98.4, ask: 105.2, last: 101.5, iv: 0.685 },
      { type: 'call', strike: 3300, bid: 50.1, ask: 55.5, last: 52.8, iv: 0.720 },
      { type: 'put', strike: 3200, bid: 58.7, ask: 65.1, last: 61.4, iv: 0.672 },
      { type: 'put', strike: 3100, bid: 25.8, ask: 32.4, last: 28.9, iv: 0.650 },
    ],
    'BTC': [
      { type: 'call', strike: 68000, bid: 2500, ask: 2600, last: 2550, iv: 0.600 },
      { type: 'call', strike: 70000, bid: 1500, ask: 1600, last: 1550, iv: 0.620 },
      { type: 'put', strike: 68000, bid: 1800, ask: 1900, last: 1850, iv: 0.580 },
      { type: 'put', strike: 66000, bid: 900, ask: 1000, last: 950, iv: 0.560 },
    ],
  };

  const currentAsset = cryptoAssets.find(asset => asset.symbol === selectedAsset);
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                Simple Crypto Options
              </h1>
              <p className="text-gray-400 mt-1">
                Trade popular crypto options with ease
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">Markets Always Open</span>
            </div>
          </div>

          {/* Asset Selector */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Select Crypto Asset</h2>
            <div className="flex flex-wrap gap-4">
              {cryptoAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedAsset === asset.symbol
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{asset.symbol}</span>
                      <span className="text-xs text-gray-400">{asset.name}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">${asset.price.toLocaleString()}</div>
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
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
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
                    stroke="#f97316"
                    strokeWidth={3}
                    fill="url(#priceGradient)"
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
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-white"
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
                        className={`border-b border-gray-600 hover:bg-gray-600 ${selectedOption === option ? 'bg-orange-900/50' : ''}`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <td className="py-3 px-6 text-left">{option.strike}</td>
                        <td className="py-3 px-6 text-left">{option.bid}</td>
                        <td className="py-3 px-6 text-left">{option.ask}</td>
                        <td className="py-3 px-6 text-left">{option.last}</td>
                        <td className="py-3 px-6 text-center">
                          <button
                            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-1 px-3 rounded text-xs"
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
                      {selectedAsset} {selectedOption.strike} {selectedOption.type.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400">
                      Exp: {selectedExpiry}
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
                    <span className="text-white font-medium">${selectedOption.ask}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white font-medium">${(selectedOption.ask * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium">
                  Buy {selectedOption.type.toUpperCase()} • ${(selectedOption.ask * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          )}

          {/* P&L Calculator */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold mb-4">P&L Calculator</h3>
            
            {selectedOption && currentAsset && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Price at Expiry
                  </label>
                  <input
                    type="range"
                    min={currentAsset.price * 0.7}
                    max={currentAsset.price * 1.3}
                    step="10"
                    defaultValue={currentAsset.price}
                    className="w-full"
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      const pnl = calculatePnL(selectedOption.strike, selectedOption.type, selectedOption.ask, price);
                      e.target.nextElementSibling.textContent = `${price.toFixed(0)}`;
                      e.target.parentElement.nextElementSibling.children[1].textContent = 
                        `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;
                      e.target.parentElement.nextElementSibling.children[1].className = 
                        `font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
                    }}
                  />
                  <div className="text-center text-white font-medium mt-1">
                    ${currentAsset.price.toFixed(0)}
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated P&L:</span>
                    <span className="text-white font-bold text-lg">$0.00</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  💡 Drag slider to see P&L at different price levels
                </div>
              </div>
            )}
            
            {!selectedOption && (
              <div className="text-center text-gray-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                <p>Select an option to see P&L scenarios</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCryptoTradingScreen;
