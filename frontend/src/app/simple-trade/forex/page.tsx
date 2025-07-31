'use client'
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const SimpleForexTradingScreen = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  // Mock forex pairs (simplified list)
  const forexPairs = [
    { 
      symbol: 'EUR/USD', 
      name: 'Euro / US Dollar', 
      price: 1.0875, 
      change: +0.0032, 
      changePercent: +0.29,
      volatility: 12.5,
      pip: 0.0001
    },
    { 
      symbol: 'GBP/USD', 
      name: 'British Pound / US Dollar', 
      price: 1.2895, 
      change: -0.0085, 
      changePercent: -0.65,
      volatility: 15.8,
      pip: 0.0001
    },
  ];

  // Mock price chart data (simplified)
  const priceData = [
    { time: '00:00', price: 1.0843 },
    { time: '06:00', price: 1.0858 },
    { time: '12:00', price: 1.0871 },
    { time: '18:00', price: 1.0869 },
  ];

  // Mock expiry dates (simplified)
  const expiryDates = [
    { date: '2024-08-30', label: '1 Month' },
    { date: '2024-09-30', label: '2 Months' },
  ];

  // Mock forex options chain (simplified)
  const optionsChain = {
    'EUR/USD': [
      { type: 'call', strike: 1.0850, bid: 0.0055, ask: 0.0062, last: 0.0058 },
      { type: 'call', strike: 1.0900, bid: 0.0025, ask: 0.0032, last: 0.0028 },
      { type: 'put', strike: 1.0850, bid: 0.0035, ask: 0.0042, last: 0.0038 },
      { type: 'put', strike: 1.0800, bid: 0.0018, ask: 0.0025, last: 0.0021 },
    ],
    'GBP/USD': [
      { type: 'call', strike: 1.2850, bid: 0.0080, ask: 0.0085, last: 0.0082 },
      { type: 'call', strike: 1.2900, bid: 0.0040, ask: 0.0045, last: 0.0042 },
      { type: 'put', strike: 1.2850, bid: 0.0050, ask: 0.0055, last: 0.0052 },
      { type: 'put', strike: 1.2800, bid: 0.0025, ask: 0.0030, last: 0.0028 },
    ],
  };

  const currentPair = forexPairs.find(pair => pair.symbol === selectedPair);
  const availableOptions = optionsChain[selectedPair] || [];

  useEffect(() => {
    setSelectedOption(null);
    setShowOrderPanel(false);
  }, [selectedPair, selectedExpiry]);

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

  const formatPips = (value, pipSize) => {
    const pips = Math.abs(value) / pipSize;
    return `${pips.toFixed(1)} pips`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      <OptionsHeader />
      
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Simple Forex Options
              </h1>
              <p className="text-gray-400 mt-1">
                Trade popular forex options with ease
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-500/20">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-sm font-medium">Forex Market Open (24/5)</span>
            </div>
          </div>

          {/* Currency Pair Selector */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Select Currency Pair</h2>
            <div className="flex flex-wrap gap-4">
              {forexPairs.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => setSelectedPair(pair.symbol)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedPair === pair.symbol
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{pair.symbol}</span>
                      <span className="text-xs text-gray-400">{pair.name}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{pair.price.toFixed(4)}</div>
                    <div className={`text-sm ${pair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(4)} ({pair.change >= 0 ? '+' : ''}{pair.changePercent}%)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">{selectedPair} Price Chart</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="forexPriceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={['dataMin - 0.001', 'dataMax + 0.001']} />
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
                    fill="url(#forexPriceGradient)"
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
                        <td className="py-3 px-6 text-left">{option.strike.toFixed(4)}</td>
                        <td className="py-3 px-6 text-left">{option.bid.toFixed(4)}</td>
                        <td className="py-3 px-6 text-left">{option.ask.toFixed(4)}</td>
                        <td className="py-3 px-6 text-left">{option.last.toFixed(4)}</td>
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
                      <td colSpan="5" className="py-4 text-center text-gray-400">No options available for this pair.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Panel */}
          {showOrderPanel && selectedOption && currentPair && (
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
                      {selectedPair} {selectedOption.strike.toFixed(4)} {selectedOption.type.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400">
                      Exp: {selectedExpiry} • Notional: $100K per contract
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
                    <span className="text-white font-medium">{selectedOption.ask.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Premium:</span>
                    <span className="text-white font-medium">${(selectedOption.ask * quantity * 100000).toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-medium">
                  Buy {selectedOption.type.toUpperCase()} • ${(selectedOption.ask * quantity * 100000).toFixed(2)}
                </button>
              </div>
            </div>
          )}

          {/* P&L Calculator */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Pip Profit Calculator</h3>
            
            {selectedOption && currentPair && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Exchange Rate at Expiry
                  </label>
                  <input
                    type="range"
                    min={currentPair.price * 0.95}
                    max={currentPair.price * 1.05}
                    step="0.0001"
                    defaultValue={currentPair.price}
                    className="w-full"
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      const pnl = calculatePnL(selectedOption.strike, selectedOption.type, selectedOption.ask, price) * quantity * 100000;
                      e.target.nextElementSibling.textContent = `${price.toFixed(4)}`;
                      e.target.parentElement.nextElementSibling.children[1].textContent = 
                        `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;
                      e.target.parentElement.nextElementSibling.children[1].className = 
                        `font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
                      e.target.parentElement.nextElementSibling.children[3].textContent = 
                        `${formatPips(Math.abs(price - currentPair.price), currentPair.pip)} ${price > currentPair.price ? 'up' : 'down'}`;
                    }}
                  />
                  <div className="text-center text-white font-medium mt-1">
                    {currentPair.price.toFixed(4)}
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated P&L:</span>
                    <span className="text-white font-bold text-lg">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Pip Movement:</span>
                    <span className="text-blue-400 font-medium">0.0 pips</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  💡 Drag slider to see P&L at different exchange rate levels
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

export default SimpleForexTradingScreen;
