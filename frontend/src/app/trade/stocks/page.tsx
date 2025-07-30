'use client'
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const StockTradingScreen = () => {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [selectedStrategy, setSelectedStrategy] = useState('long-call');
  const [orderType, setOrderType] = useState('market');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [isMarketHours, setIsMarketHours] = useState(true);

  // Mock stock assets with 24/7 synthetic pricing
  const stockAssets = [
    { 
      symbol: 'AAPL', 
      name: 'Apple Inc.', 
      price: 185.75, 
      change: +3.25, 
      changePercent: +1.78,
      volume24h: '89.5M',
      volatility: 28.5,
      marketCap: '2.89T',
      sector: 'Technology',
      earnings: '2024-08-01',
      synthetic24x7: true
    },
    { 
      symbol: 'TSLA', 
      name: 'Tesla Inc.', 
      price: 248.50, 
      change: +12.75, 
      changePercent: +5.41,
      volume24h: '125.8M',
      volatility: 45.8,
      marketCap: '785.2B',
      sector: 'Automotive',
      earnings: '2024-07-24',
      synthetic24x7: true
    },
    { 
      symbol: 'MSFT', 
      name: 'Microsoft Corp.', 
      price: 425.80, 
      change: -2.15, 
      changePercent: -0.50,
      volume24h: '45.3M',
      volatility: 22.1,
      marketCap: '3.15T',
      sector: 'Technology',
      earnings: '2024-07-25',
      synthetic24x7: true
    },
    { 
      symbol: 'GOOGL', 
      name: 'Alphabet Inc.', 
      price: 178.25, 
      change: +5.85, 
      changePercent: +3.40,
      volume24h: '32.7M',
      volatility: 31.2,
      marketCap: '2.21T',
      sector: 'Technology',
      earnings: '2024-07-24',
      synthetic24x7: true
    },
    { 
      symbol: 'NVDA', 
      name: 'NVIDIA Corp.', 
      price: 118.75, 
      change: +8.45, 
      changePercent: +7.66,
      volume24h: '485.2M',
      volatility: 52.3,
      marketCap: '2.91T',
      sector: 'Technology',
      earnings: '2024-08-28',
      synthetic24x7: true
    }
  ];

  // Mock price chart data showing 24/7 trading
  const priceData = [
    { time: '9:30', price: 182.50, volume: 2.8, session: 'market' },
    { time: '12:00', price: 183.75, volume: 3.2, session: 'market' },
    { time: '16:00', price: 184.20, volume: 4.1, session: 'market' },
    { time: '18:00', price: 184.85, volume: 1.2, session: 'after-hours' },
    { time: '22:00', price: 185.15, volume: 0.8, session: 'overnight' },
    { time: '02:00', price: 185.75, volume: 0.9, session: 'pre-market' },
  ];

  // Mock expiry dates (standard monthly + weekly)
  const expiryDates = [
    { date: '2024-08-02', label: '2d', type: 'weekly' },
    { date: '2024-08-09', label: '9d', type: 'weekly' },
    { date: '2024-08-16', label: '16d', type: 'monthly' },
    { date: '2024-09-20', label: '51d', type: 'monthly' },
    { date: '2024-12-20', label: '144d', type: 'quarterly' }
  ];

  // Mock options chain data for stocks
  const optionsChain = [
    // Calls
    { type: 'call', strike: 170, bid: 16.50, ask: 17.20, last: 16.85, volume: 1247, oi: 8934, iv: 0.285, delta: 0.89, gamma: 0.012, theta: -0.18, vega: 2.4 },
    { type: 'call', strike: 175, bid: 12.25, ask: 12.85, last: 12.55, volume: 2156, oi: 12847, iv: 0.295, delta: 0.82, gamma: 0.018, theta: -0.22, vega: 3.1 },
    { type: 'call', strike: 180, bid: 8.75, ask: 9.25, last: 9.00, volume: 3892, oi: 18765, iv: 0.308, delta: 0.72, gamma: 0.024, theta: -0.28, vega: 4.2 },
    { type: 'call', strike: 185, bid: 4.85, ask: 5.35, last: 5.10, volume: 5647, oi: 23891, iv: 0.325, delta: 0.58, gamma: 0.028, theta: -0.31, vega: 4.8 },
    { type: 'call', strike: 190, bid: 2.15, ask: 2.65, last: 2.40, volume: 4235, oi: 19234, iv: 0.348, delta: 0.42, gamma: 0.025, theta: -0.29, vega: 4.1 },
    { type: 'call', strike: 195, bid: 0.85, ask: 1.25, last: 1.05, volume: 2187, oi: 12456, iv: 0.375, delta: 0.28, gamma: 0.018, theta: -0.24, vega: 3.2 },
    // Puts  
    { type: 'put', strike: 170, bid: 0.45, ask: 0.85, last: 0.65, volume: 856, oi: 6789, iv: 0.278, delta: -0.11, gamma: 0.012, theta: -0.16, vega: 2.2 },
    { type: 'put', strike: 175, bid: 1.25, ask: 1.75, last: 1.50, volume: 1534, oi: 9876, iv: 0.288, delta: -0.18, gamma: 0.018, theta: -0.20, vega: 2.9 },
    { type: 'put', strike: 180, bid: 2.85, ask: 3.35, last: 3.10, volume: 2947, oi: 15234, iv: 0.301, delta: -0.28, gamma: 0.024, theta: -0.26, vega: 3.9 },
    { type: 'put', strike: 185, bid: 5.75, ask: 6.25, last: 6.00, volume: 4821, oi: 20145, iv: 0.318, delta: -0.42, gamma: 0.028, theta: -0.29, vega: 4.6 },
    { type: 'put', strike: 190, bid: 10.25, ask: 10.75, last: 10.50, volume: 3692, oi: 16789, iv: 0.341, delta: -0.58, gamma: 0.025, theta: -0.27, vega: 3.9 },
    { type: 'put', strike: 195, bid: 16.85, ask: 17.45, last: 17.15, volume: 1987, oi: 11234, iv: 0.368, delta: -0.72, gamma: 0.018, theta: -0.22, vega: 3.0 }
  ];

  const currentAsset = stockAssets.find(asset => asset.symbol === selectedAsset);
  const calls = optionsChain.filter(option => option.type === 'call');
  const puts = optionsChain.filter(option => option.type === 'put');

  // Check market hours (simplified)
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Market hours: 9:30 AM - 4:00 PM EST, Mon-Fri
    const isWeekday = day >= 1 && day <= 5;
    const inMarketHours = hour >= 9 && hour < 16;
    
    setIsMarketHours(isWeekday && inMarketHours);
  }, []);

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

  const getSessionColor = (session) => {
    switch(session) {
      case 'market': return '#10b981';
      case 'after-hours': return '#f59e0b';
      case 'overnight': return '#8b5cf6';
      case 'pre-market': return '#3b82f6';
      default: return '#6b7280';
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Stock Options Trading
              </h1>
              <p className="text-gray-400 mt-1">
                Trade stock options 24/7 with synthetic pricing • Your competitive advantage
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 24/7 Status */}
              <div className="flex items-center space-x-2 bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/20">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-purple-300 text-sm font-medium">24/7 Synthetic Trading</span>
              </div>
              
              {/* Traditional Market Hours Status */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                isMarketHours 
                  ? 'bg-green-900/30 border-green-500/20' 
                  : 'bg-red-900/30 border-red-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isMarketHours ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  isMarketHours ? 'text-green-300' : 'text-red-300'
                }`}>
                  Traditional Market {isMarketHours ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Advantage Banner */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-center space-x-4 text-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-purple-300 font-medium">🚀 BREAKTHROUGH: Trade Apple, Tesla & more options while Wall Street sleeps!</span>
              </div>
            </div>
          </div>

          {/* Asset Selector */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
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
                      <span className="text-xs text-gray-400">{asset.sector}</span>
                      {asset.synthetic24x7 && (
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs">24/7</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mt-0.5">{asset.name}</div>
                    <div className="text-2xl font-bold mt-1">${asset.price.toFixed(2)}</div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)} ({asset.change >= 0 ? '+' : ''}{asset.changePercent}%)
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Vol: {asset.volatility}% • MCap: {asset.marketCap}
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      Next Earnings: {asset.earnings}
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
              
              {/* Price Chart with 24/7 Sessions */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{selectedAsset} - 24/7 Synthetic Pricing</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Real-time synthetic pricing enables options trading around the clock
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {['1H', '4H', '1D', '1W'].map((timeframe) => (
                      <button
                        key={timeframe}
                        onClick={() => setChartTimeframe(timeframe)}
                        className={`px-3 py-1 rounded text-sm ${
                          chartTimeframe === timeframe
                            ? 'bg-blue-500 text-white'
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
                        labelFormatter={(value, payload) => {
                          const session = payload?.[0]?.payload?.session || '';
                          return `${value} (${session.replace('-', ' ')})`;
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
                
                {/* Session Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('market')}}></div>
                    <span className="text-gray-300">Market Hours (9:30-16:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('after-hours')}}></div>
                    <span className="text-gray-300">After Hours (16:00-20:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('overnight')}}></div>
                    <span className="text-gray-300">Overnight (20:00-04:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('pre-market')}}></div>
                    <span className="text-gray-300">Pre-Market (04:00-9:30)</span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">52w High:</span>
                    <span className="text-green-400 ml-2 font-medium">${(currentAsset.price * 1.245).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">52w Low:</span>
                    <span className="text-red-400 ml-2 font-medium">${(currentAsset.price * 0.731).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">P/E Ratio:</span>
                    <span className="text-white ml-2 font-medium">28.5</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Dividend:</span>
                    <span className="text-blue-400 ml-2 font-medium">$0.24</span>
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
                          <span>IV</span>
                        </div>
                        {calls.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className={`grid grid-cols-6 gap-2 p-2 rounded transition-all text-sm hover:bg-gray-700/50 ${
                              Math.abs(option.strike - currentAsset.price) < 2.5 ? 'bg-yellow-500/10 border border-yellow-500/30' : ''
                            } ${
                              option.strike < currentAsset.price ? 'bg-green-500/5' : 'bg-gray-900/30'
                            }`}
                          >
                            <span className="font-medium text-white">${option.strike}</span>
                            <span className="text-green-400">${option.bid.toFixed(2)}</span>
                            <span className="text-red-400">${option.ask.toFixed(2)}</span>
                            <span className="text-white">${option.last.toFixed(2)}</span>
                            <span className="text-gray-300">{option.volume}</span>
                            <span className="text-blue-400">{(option.iv * 100).toFixed(0)}%</span>
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
                          <span>IV</span>
                        </div>
                        {puts.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className={`grid grid-cols-6 gap-2 p-2 rounded transition-all text-sm hover:bg-gray-700/50 ${
                              Math.abs(option.strike - currentAsset.price) < 2.5 ? 'bg-yellow-500/10 border border-yellow-500/30' : ''
                            } ${
                              option.strike > currentAsset.price ? 'bg-red-500/5' : 'bg-gray-900/30'
                            }`}
                          >
                            <span className="font-medium text-white">${option.strike}</span>
                            <span className="text-green-400">${option.bid.toFixed(2)}</span>
                            <span className="text-red-400">${option.ask.toFixed(2)}</span>
                            <span className="text-white">${option.last.toFixed(2)}</span>
                            <span className="text-gray-300">{option.volume}</span>
                            <span className="text-blue-400">{(option.iv * 100).toFixed(0)}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  💡 Click any option to trade • Green = ITM • ATM options highlighted in yellow • All prices are synthetic for 24/7 trading
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
                    <span className="text-white font-medium">${currentAsset.price.toFixed(2)}</span>
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
                    <span className="text-gray-400">Volume:</span>
                    <span className="text-white font-medium">{currentAsset.volume24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="text-white font-medium">{currentAsset.marketCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sector:</span>
                    <span className="text-blue-400 font-medium">{currentAsset.sector}</span>
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
                          <div className="text-xs opacity-80">Bullish on Stock</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('long-put')}
                        className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Buy Put</div>
                          <div className="text-xs opacity-80">Bearish on Stock</div>
                        </div>
                      </button>
                    </div>

                    {/* Earnings Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('long-straddle')}
                        className="bg-gradient-to-r from-yellow-600 to-orange-600 p-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Earnings Straddle</div>
                          <div className="text-xs opacity-80">Big Move Expected</div>
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

                    {/* Spread Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('bull-spread')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Bull Spread</div>
                          <div className="text-xs opacity-80">Limited Risk</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('bear-spread')}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Bear Spread</div>
                          <div className="text-xs opacity-80">Limited Risk</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Strategy Description */}
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-400">
                      {selectedStrategy === 'long-call' && '📈 Buy call option to profit from stock going up. Perfect for bullish outlook before earnings.'}
                      {selectedStrategy === 'long-put' && '📉 Buy put option to profit from stock decline. Great for hedging or bearish outlook.'}
                      {selectedStrategy === 'bull-spread' && '🎯 Buy lower strike call, sell higher strike call. Limited risk, moderate reward.'}
                      {selectedStrategy === 'bear-spread' && '🎯 Buy higher strike put, sell lower strike put. Profit from moderate decline.'}
                      {selectedStrategy === 'long-straddle' && '⚡ Buy call and put at same strike. Perfect for earnings when big move expected.'}
                      {selectedStrategy === 'long-strangle' && '⚡ Buy call and put at different strikes. Lower cost than straddle for volatility plays.'}
                      {selectedStrategy === 'iron-condor' && '🏠 Sell both call and put spreads. Profit when stock stays in range.'}
                      {selectedStrategy === 'butterfly' && '🦋 Limited risk strategy for stocks expected to stay near target price.'}
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
                          Exp: {selectedExpiry} • Contracts: 100 shares each
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
                        <label className="block text-sm text-gray-400 mb-1">Contracts</label>
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
                        <span className="text-gray-400">Premium per Contract:</span>
                        <span className="text-white font-medium">${selectedOption.ask.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Premium:</span>
                        <span className="text-white font-medium">${(selectedOption.ask * quantity * 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shares Controlled:</span>
                        <span className="text-blue-400 font-medium">{quantity * 100} shares</span>
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
                        <span className="text-red-400 font-medium">${(selectedOption.ask * quantity * 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Reward:</span>
                        <span className="text-green-400 font-medium">
                          {selectedOption.type === 'call' ? 'Unlimited' : `${((selectedOption.strike - selectedOption.ask) * quantity * 100).toFixed(0)}`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400">Delta</div>
                        <div className="font-medium">{selectedOption.delta.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Gamma</div>
                        <div className="font-medium">{selectedOption.gamma.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Theta</div>
                        <div className="font-medium">{selectedOption.theta.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Vega</div>
                        <div className="font-medium">{selectedOption.vega.toFixed(1)}</div>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-medium">
                      Buy {selectedOption.type.toUpperCase()} • ${(selectedOption.ask * quantity * 100).toFixed(2)}
                    </button>

                    <div className="text-xs text-gray-400 mt-2 text-center">
                      💡 24/7 trading with synthetic pricing • Settlement via 1inch protocol
                    </div>
                  </div>
                </div>
              )}

              {/* Trading Highlights for Stocks */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Stock Trading Highlights</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">24/7 stock options - trade Apple at 3 AM!</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Synthetic pricing during market close</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Standard 100-share contracts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Earnings event strategies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Cash settlement - no shares delivered</span>
                  </div>
                </div>
              </div>

              {/* P&L Calculator */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Profit/Loss Scenarios</h3>
                
                {selectedOption && (
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
                      <div className="text-xs text-gray-400 mt-2">
                        Based on {quantity} contract(s) controlling {quantity * 100} shares
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

          {/* Recent Activity & Earnings Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Stock Options Activity */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Recent Stock Options Activity</h3>
              
              <div className="space-y-3">
                {[
                  { asset: 'AAPL', type: 'Call', strike: '$185', size: '10', price: '$5.10', time: '3m ago', status: 'buy', session: 'after-hours' },
                  { asset: 'TSLA', type: 'Put', strike: '$245', size: '5', price: '$8.75', time: '8m ago', status: 'sell', session: 'market' },
                  { asset: 'MSFT', type: 'Call', strike: '$430', size: '15', price: '$3.25', time: '12m ago', status: 'buy', session: 'market' },
                  { asset: 'GOOGL', type: 'Straddle', strike: '$180', size: '8', price: '$12.50', time: '18m ago', status: 'buy', session: 'pre-market' },
                  { asset: 'NVDA', type: 'Call', strike: '$125', size: '25', price: '$2.85', time: '22m ago', status: 'buy', session: 'overnight' }
                ].map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${trade.status === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.asset}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            trade.type === 'Call' ? 'bg-green-500/20 text-green-400' : 
                            trade.type === 'Put' ? 'bg-red-500/20 text-red-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {trade.type}
                          </span>
                          <span className="text-gray-300 text-sm">{trade.strike}</span>
                          <span className="text-xs text-gray-500 bg-gray-700 px-1 rounded">
                            {trade.session}
                          </span>
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
                View All Stock Activity →
              </button>
            </div>

            {/* Earnings Calendar & Events */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Earnings Calendar & Events</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-blue-400 font-medium text-sm">EARNINGS TODAY</div>
                      <div className="text-white text-sm mt-1">
                        GOOGL reports Q2 earnings after market close. High IV on options expiring this week.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">Expected move: ±8%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-green-400 font-medium text-sm">UPCOMING EARNINGS</div>
                      <div className="text-white text-sm mt-1">
                        AAPL earnings in 3 days. Options showing increased activity and rising IV.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">July 31st after close • Expected: ±6%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-yellow-400 font-medium text-sm">HIGH IV OPPORTUNITY</div>
                      <div className="text-white text-sm mt-1">
                        NVDA options showing 65% IV ahead of earnings. Consider volatility strategies.
                      </div>
                      <div className="text-gray-400 text-xs mt-2">IV Rank: 85% • Earnings: Aug 28</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-purple-400 font-medium text-sm">24/7 ADVANTAGE</div>
                      <div className="text-white text-sm mt-1">
                        Trade stock options during Asian market hours while US markets sleep!
                      </div>
                      <div className="text-gray-400 text-xs mt-2">Synthetic pricing available 24/7</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 24/7 Stock Trading Advantage Banner */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-xl border border-blue-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  🚀 Revolutionary 24/7 Stock Options Trading
                </h3>
                <p className="text-gray-300 mt-2">
                  Be the first to trade Apple, Tesla, and Microsoft options while traditional markets sleep. 
                  Our synthetic pricing technology breaks the 150-year constraint of market hours.
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300">Synthetic 24/7 Pricing</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">Standard Contracts (100 shares)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">Cash Settlement</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-300">Earnings Event Trading</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">24</div>
                  <div className="text-xs text-gray-400">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">7</div>
                  <div className="text-xs text-gray-400">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">∞</div>
                  <div className="text-xs text-gray-400">Possibilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTradingScreen;