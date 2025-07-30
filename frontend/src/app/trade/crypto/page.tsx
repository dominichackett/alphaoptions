'use client'
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const CryptoTradingScreen = () => {
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [selectedStrategy, setSelectedStrategy] = useState('single');
  const [orderType, setOrderType] = useState('market');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  // Mock crypto assets
  const cryptoAssets = [
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      price: 3245.67, 
      change: +125.43, 
      changePercent: +4.02,
      volume24h: '2.8B',
      volatility: 68.5,
      marketCap: '390.2B'
    },
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      price: 67850.25, 
      change: +2150.75, 
      changePercent: +3.27,
      volume24h: '15.2B',
      volatility: 58.2,
      marketCap: '1.34T'
    },
    { 
      symbol: 'LINK', 
      name: 'Chainlink', 
      price: 14.85, 
      change: -0.32, 
      changePercent: -2.11,
      volume24h: '145M',
      volatility: 78.9,
      marketCap: '8.7B'
    },
    { 
      symbol: 'UNI', 
      name: 'Uniswap', 
      price: 8.94, 
      change: +0.78, 
      changePercent: +9.55,
      volume24h: '89M',
      volatility: 85.3,
      marketCap: '5.4B'
    },
    { 
      symbol: 'AAVE', 
      name: 'Aave', 
      price: 125.67, 
      change: +8.45, 
      changePercent: +7.21,
      volume24h: '178M',
      volatility: 92.1,
      marketCap: '1.9B'
    }
  ];

  // Mock price chart data
  const priceData = [
    { time: '00:00', price: 3120, volume: 145 },
    { time: '04:00', price: 3145, volume: 189 },
    { time: '08:00', price: 3089, volume: 234 },
    { time: '12:00', price: 3178, volume: 287 },
    { time: '16:00', price: 3205, volume: 198 },
    { time: '20:00', price: 3245, volume: 156 },
  ];

  // Mock expiry dates
  const expiryDates = [
    { date: '2024-08-07', label: '7d', type: 'weekly' },
    { date: '2024-08-15', label: '15d', type: 'weekly' },
    { date: '2024-08-30', label: '30d', type: 'monthly' },
    { date: '2024-09-27', label: '60d', type: 'monthly' },
    { date: '2024-12-27', label: '150d', type: 'quarterly' }
  ];

  // Mock options chain data
  const optionsChain = [
    // Calls
    { type: 'call', strike: 2800, bid: 455.2, ask: 462.1, last: 458.5, volume: 234, oi: 1847, iv: 0.625, delta: 0.89, gamma: 0.002, theta: -2.1, vega: 8.4 },
    { type: 'call', strike: 3000, bid: 268.7, ask: 275.3, last: 271.8, volume: 567, oi: 3421, iv: 0.598, delta: 0.76, gamma: 0.008, theta: -3.2, vega: 12.6 },
    { type: 'call', strike: 3200, bid: 98.4, ask: 105.2, last: 101.5, volume: 892, oi: 5673, iv: 0.685, delta: 0.52, gamma: 0.012, theta: -4.8, vega: 18.2 },
    { type: 'call', strike: 3400, bid: 28.9, ask: 34.1, last: 31.2, volume: 445, oi: 2890, iv: 0.742, delta: 0.28, gamma: 0.009, theta: -3.1, vega: 15.7 },
    { type: 'call', strike: 3600, bid: 8.2, ask: 12.4, last: 10.1, volume: 189, oi: 1234, iv: 0.798, delta: 0.12, gamma: 0.004, theta: -1.8, vega: 9.8 },
    // Puts  
    { type: 'put', strike: 2800, bid: 12.1, ask: 18.7, last: 15.2, volume: 156, oi: 987, iv: 0.612, delta: -0.11, gamma: 0.002, theta: -1.9, vega: 8.1 },
    { type: 'put', strike: 3000, bid: 25.8, ask: 32.4, last: 28.9, volume: 378, oi: 2456, iv: 0.587, delta: -0.24, gamma: 0.008, theta: -3.0, vega: 12.3 },
    { type: 'put', strike: 3200, bid: 58.7, ask: 65.1, last: 61.4, volume: 634, oi: 4123, iv: 0.672, delta: -0.48, gamma: 0.012, theta: -4.5, vega: 17.8 },
    { type: 'put', strike: 3400, bid: 168.9, ask: 175.6, last: 172.1, volume: 423, oi: 2876, iv: 0.731, delta: -0.72, gamma: 0.009, theta: -2.9, vega: 15.4 },
    { type: 'put', strike: 3600, bid: 378.2, ask: 385.7, last: 381.5, volume: 234, oi: 1567, iv: 0.785, delta: -0.88, gamma: 0.004, theta: -1.7, vega: 9.5 }
  ];

  const currentAsset = cryptoAssets.find(asset => asset.symbol === selectedAsset);
  const calls = optionsChain.filter(option => option.type === 'call');
  const puts = optionsChain.filter(option => option.type === 'put');

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
      {/* Header */}
      <OptionsHeader />
      
      {/* Trading Content */}
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                Crypto Options Trading
              </h1>
              <p className="text-gray-400 mt-1">
                Trade crypto options 24/7 • Never miss a move
              </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">Markets Always Open</span>
            </div>
          </div>

          {/* Asset Selector */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
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
                      {asset.change >= 0 ? '+' : ''}${asset.change} ({asset.change >= 0 ? '+' : ''}{asset.changePercent}%)
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Vol: {asset.volatility}% • 24h: {asset.volume24h}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Section */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Price Chart */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">{selectedAsset} Price Chart</h3>
                  <div className="flex items-center space-x-2">
                    {['1H', '4H', '1D', '1W'].map((timeframe) => (
                      <button
                        key={timeframe}
                        onClick={() => setChartTimeframe(timeframe)}
                        className={`px-3 py-1 rounded text-sm ${
                          chartTimeframe === timeframe
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {timeframe}
                      </button>
                    ))}
                  </div>
                </div>
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
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">24h High:</span>
                    <span className="text-green-400 ml-2 font-medium">${(currentAsset.price * 1.045).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h Low:</span>
                    <span className="text-red-400 ml-2 font-medium">${(currentAsset.price * 0.962).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">IV Rank:</span>
                    <span className="text-yellow-400 ml-2 font-medium">68%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="text-white ml-2 font-medium">{currentAsset.marketCap}</span>
                  </div>
                </div>
              </div>

              {/* Options Chain */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                  <h3 className="text-xl font-bold">Options Chain</h3>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Expiry:</span>
                      <select 
                        value={selectedExpiry}
                        onChange={(e) => setSelectedExpiry(e.target.value)}
                        className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                      >
                        {expiryDates.map((expiry) => (
                          <option key={expiry.date} value={expiry.date}>
                            {expiry.label} ({expiry.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Options Chain Table */}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Calls */}
                    <div>
                      <h4 className="text-lg font-semibold text-green-400 mb-4 text-center">CALLS</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-2 text-xs text-gray-400 font-medium px-2">
                          <span>Strike</span>
                          <span>Bid</span>
                          <span>Ask</span>
                          <span>Last</span>
                          <span>Vol</span>
                          <span>Greeks</span>
                        </div>
                        {calls.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className={`grid grid-cols-6 gap-2 p-2 rounded transition-all text-sm hover:bg-gray-700/50 ${
                              option.strike === currentAsset.price ? 'bg-yellow-500/10 border border-yellow-500/30' : ''
                            } ${
                              option.strike < currentAsset.price ? 'bg-green-500/5' : 'bg-gray-900/30'
                            }`}
                          >
                            <span className="font-medium text-white">{option.strike}</span>
                            <span className="text-green-400">{option.bid}</span>
                            <span className="text-red-400">{option.ask}</span>
                            <span className="text-white">{option.last}</span>
                            <span className="text-gray-300">{option.volume}</span>
                            <div className="text-xs text-gray-400">
                              δ{option.delta.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Puts */}
                    <div>
                      <h4 className="text-lg font-semibold text-red-400 mb-4 text-center">PUTS</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-2 text-xs text-gray-400 font-medium px-2">
                          <span>Strike</span>
                          <span>Bid</span>
                          <span>Ask</span>
                          <span>Last</span>
                          <span>Vol</span>
                          <span>Greeks</span>
                        </div>
                        {puts.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className={`grid grid-cols-6 gap-2 p-2 rounded transition-all text-sm hover:bg-gray-700/50 ${
                              option.strike === currentAsset.price ? 'bg-yellow-500/10 border border-yellow-500/30' : ''
                            } ${
                              option.strike > currentAsset.price ? 'bg-red-500/5' : 'bg-gray-900/30'
                            }`}
                          >
                            <span className="font-medium text-white">{option.strike}</span>
                            <span className="text-green-400">{option.bid}</span>
                            <span className="text-red-400">{option.ask}</span>
                            <span className="text-white">{option.last}</span>
                            <span className="text-gray-300">{option.volume}</span>
                            <div className="text-xs text-gray-400">
                              δ{option.delta.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  💡 Click any option to trade • Green = ITM • ATM options highlighted in yellow
                </div>
              </div>
            </div>

            {/* Trading Panel */}
            <div className="space-y-6">
              
              {/* Market Stats */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Market Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="text-white font-medium">${currentAsset.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Change:</span>
                    <span className={`font-medium ${currentAsset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {currentAsset.change >= 0 ? '+' : ''}{currentAsset.changePercent}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Implied Vol:</span>
                    <span className="text-yellow-400 font-medium">{currentAsset.volatility}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume 24h:</span>
                    <span className="text-white font-medium">{currentAsset.volume24h}</span>
                  </div>
                </div>
              </div>

              {/* Strategy Builder */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Trading Strategies</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Strategy</label>
                    <select 
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    >
                      <option value="long-call">Long Call (Buy Call)</option>
                      <option value="long-put">Long Put (Buy Put)</option>
                      <option value="bull-spread">Bull Call Spread</option>
                      <option value="bear-spread">Bear Put Spread</option>
                      <option value="long-straddle">Long Straddle</option>
                      <option value="long-strangle">Long Strangle</option>
                      <option value="iron-condor">Iron Condor</option>
                      <option value="butterfly">Butterfly Spread</option>
                    </select>
                  </div>

                  {/* Quick Strategy Buttons */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-400 font-medium">Quick Actions:</div>
                    
                    {/* Directional Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('long-call')}
                        className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Buy Call</div>
                          <div className="text-xs opacity-80">Bullish Direction</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('long-put')}
                        className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Buy Put</div>
                          <div className="text-xs opacity-80">Bearish Direction</div>
                        </div>
                      </button>
                    </div>

                    {/* Spread Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('bull-spread')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Bull Spread</div>
                          <div className="text-xs opacity-80">Limited Risk/Reward</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('bear-spread')}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Bear Spread</div>
                          <div className="text-xs opacity-80">Limited Risk/Reward</div>
                        </div>
                      </button>
                    </div>

                    {/* Volatility Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('long-straddle')}
                        className="bg-gradient-to-r from-yellow-600 to-orange-600 p-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Long Straddle</div>
                          <div className="text-xs opacity-80">High Volatility</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('iron-condor')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Iron Condor</div>
                          <div className="text-xs opacity-80">Range Bound</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Strategy Description */}
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-400">
                      {selectedStrategy === 'long-call' && '📈 Buy call option to profit from upward price movement. Limited risk, unlimited upside.'}
                      {selectedStrategy === 'long-put' && '📉 Buy put option to profit from downward price movement. Limited risk, substantial downside profit.'}
                      {selectedStrategy === 'bull-spread' && '🎯 Buy lower strike call, sell higher strike call. Limited risk and reward, bullish outlook.'}
                      {selectedStrategy === 'bear-spread' && '🎯 Buy higher strike put, sell lower strike put. Limited risk and reward, bearish outlook.'}
                      {selectedStrategy === 'long-straddle' && '⚡ Buy call and put at same strike. Profits from large price moves in either direction.'}
                      {selectedStrategy === 'long-strangle' && '⚡ Buy call and put at different strikes. Lower cost than straddle, needs bigger moves.'}
                      {selectedStrategy === 'iron-condor' && '🏠 Sell call spread and put spread. Profits when price stays within range.'}
                      {selectedStrategy === 'butterfly' && '🦋 Buy 1 call, sell 2 calls, buy 1 call. Profits when price stays near middle strike.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Panel */}
              {showOrderPanel && selectedOption && (
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Order Details</h3>
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
                          Exp: {selectedExpiry}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Order Type</label>
                        <select 
                          value={orderType}
                          onChange={(e) => setOrderType(e.target.value)}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        >
                          <option value="market">Market</option>
                          <option value="limit">Limit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Premium:</span>
                        <span className="text-white font-medium">${selectedOption.ask}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Cost:</span>
                        <span className="text-white font-medium">${(selectedOption.ask * quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Breakeven:</span>
                        <span className="text-white font-medium">
                          ${selectedOption.type === 'call' 
                            ? (selectedOption.strike + selectedOption.ask).toFixed(2)
                            : (selectedOption.strike - selectedOption.ask).toFixed(2)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Risk:</span>
                        <span className="text-red-400 font-medium">${(selectedOption.ask * quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Reward:</span>
                        <span className="text-green-400 font-medium">Unlimited</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400">Delta</div>
                        <div className="font-medium">{selectedOption.delta.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Gamma</div>
                        <div className="font-medium">{selectedOption.gamma.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Theta</div>
                        <div className="font-medium">{selectedOption.theta.toFixed(1)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Vega</div>
                        <div className="font-medium">{selectedOption.vega.toFixed(1)}</div>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium">
                      Buy {selectedOption.type.toUpperCase()} • ${(selectedOption.ask * quantity).toFixed(2)}
                    </button>

                    <div className="text-xs text-gray-400 mt-2 text-center">
                      💡 Orders are settled on-chain via 1inch protocol for optimal execution
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Trading Highlights</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">24/7 trading - no weekends off!</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Gas optimized via 1inch</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Auto-exercise at expiry</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Real-time Greeks calculation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Multi-chain support</span>
                  </div>
                </div>
              </div>

              {/* P&L Calculator */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">P&L Calculator</h3>
                
                {selectedOption && (
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

          {/* Recent Activity & News */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Market Activity */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                {[
                  { asset: 'ETH', type: 'Call', strike: '$3200', size: '5', price: '$101.50', time: '2m ago', status: 'buy' },
                  { asset: 'BTC', type: 'Put', strike: '$65000', size: '2', price: '$2,450', time: '5m ago', status: 'sell' },
                  { asset: 'LINK', type: 'Call', strike: '$15', size: '10', price: '$0.85', time: '8m ago', status: 'buy' },
                  { asset: 'UNI', type: 'Put', strike: '$8', size: '15', price: '$0.45', time: '12m ago', status: 'buy' },
                  { asset: 'AAVE', type: 'Call', strike: '$130', size: '3', price: '$8.20', time: '15m ago', status: 'sell' }
                ].map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${trade.status === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.asset}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            trade.type === 'Call' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.type}
                          </span>
                          <span className="text-gray-300 text-sm">{trade.strike}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {trade.size} contracts • {trade.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{trade.price}</div>
                      <div className={`text-xs ${trade.status === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 text-center text-gray-400 hover:text-white transition-colors text-sm">
                View All Activity →
              </button>
            </div>

            {/* Market News & Alerts */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Market News & Alerts</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-blue-400 font-medium text-sm">VOLATILITY ALERT</div>
                      <div className="text-white text-sm mt-1">
                        ETH implied volatility jumped 12% in the last hour. Consider volatility strategies.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">5 minutes ago</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-yellow-400 font-medium text-sm">EXPIRY REMINDER</div>
                      <div className="text-white text-sm mt-1">
                        You have 3 options expiring in 2 days. Review your positions for potential action.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">1 hour ago</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-green-400 font-medium text-sm">OPPORTUNITY</div>
                      <div className="text-white text-sm mt-1">
                        High premium available on AAVE $120 puts. 45% IV rank suggests good entry.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">2 hours ago</div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-red-400 font-medium text-sm">RISK WARNING</div>
                      <div className="text-white text-sm mt-1">
                        Bitcoin futures are showing unusual activity. Monitor BTC options carefully.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">3 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Features Banner */}
          <div className="bg-gradient-to-r from-orange-900/30 to-purple-900/30 p-6 rounded-xl border border-orange-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                  🚀 Trade Crypto Options 24/7
                </h3>
                <p className="text-gray-300 mt-2">
                  While traditional markets sleep, crypto never stops. Capture every opportunity with round-the-clock options trading.
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">1inch Integration</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">Auto-Settlement</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300">Multi-Chain Support</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-300">Gas Optimized</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">365</div>
                  <div className="text-xs text-gray-400">Days/Year</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">24</div>
                  <div className="text-xs text-gray-400">Hours/Day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">∞</div>
                  <div className="text-xs text-gray-400">Opportunities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoTradingScreen;