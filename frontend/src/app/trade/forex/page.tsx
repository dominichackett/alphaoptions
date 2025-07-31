'use client'
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const ForexTradingScreen = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [selectedStrategy, setSelectedStrategy] = useState('long-call');
  const [orderType, setOrderType] = useState('market');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [isForexMarketOpen, setIsForexMarketOpen] = useState(true);

  // Mock forex pairs with market session data
  const forexPairs = [
    { 
      symbol: 'EUR/USD', 
      name: 'Euro / US Dollar', 
      price: 1.0875, 
      change: +0.0032, 
      changePercent: +0.29,
      volume24h: '2.8B',
      volatility: 12.5,
      spread: 0.8,
      session: 'London',
      nextEvent: 'ECB Rate Decision',
      eventDate: '2024-07-25',
      pip: 0.0001
    },
    { 
      symbol: 'GBP/USD', 
      name: 'British Pound / US Dollar', 
      price: 1.2895, 
      change: -0.0085, 
      changePercent: -0.65,
      volume24h: '1.9B',
      volatility: 15.8,
      spread: 1.2,
      session: 'London',
      nextEvent: 'BoE Meeting',
      eventDate: '2024-08-01',
      pip: 0.0001
    },
    { 
      symbol: 'USD/JPY', 
      name: 'US Dollar / Japanese Yen', 
      price: 157.25, 
      change: +0.75, 
      changePercent: +0.48,
      volume24h: '2.1B',
      volatility: 11.2,
      spread: 0.6,
      session: 'Tokyo',
      nextEvent: 'BoJ Statement',
      eventDate: '2024-07-31',
      pip: 0.01
    },
    { 
      symbol: 'AUD/USD', 
      name: 'Australian Dollar / US Dollar', 
      price: 0.6685, 
      change: +0.0045, 
      changePercent: +0.67,
      volume24h: '850M',
      volatility: 18.5,
      spread: 1.5,
      session: 'Sydney',
      nextEvent: 'RBA Decision',
      eventDate: '2024-08-06',
      pip: 0.0001
    },
    { 
      symbol: 'USD/CHF', 
      name: 'US Dollar / Swiss Franc', 
      price: 0.8925, 
      change: -0.0018, 
      changePercent: -0.20,
      volume24h: '750M',
      volatility: 9.8,
      spread: 1.1,
      session: 'London',
      nextEvent: 'SNB Meeting',
      eventDate: '2024-09-26',
      pip: 0.0001
    },
    { 
      symbol: 'USD/CAD', 
      name: 'US Dollar / Canadian Dollar', 
      price: 1.3845, 
      change: +0.0025, 
      changePercent: +0.18,
      volume24h: '685M',
      volatility: 13.2,
      spread: 1.8,
      session: 'New York',
      nextEvent: 'BoC Decision',
      eventDate: '2024-07-24',
      pip: 0.0001
    }
  ];

  // Mock price chart data showing forex market sessions
  const priceData = [
    { time: '00:00', price: 1.0843, volume: 280, session: 'wellington' },
    { time: '02:00', price: 1.0851, volume: 420, session: 'sydney' },
    { time: '06:00', price: 1.0858, volume: 680, session: 'tokyo' },
    { time: '08:00', price: 1.0862, volume: 920, session: 'london-open' },
    { time: '12:00', price: 1.0871, volume: 1580, session: 'london' },
    { time: '16:00', price: 1.0875, volume: 2100, session: 'new-york' },
    { time: '20:00', price: 1.0869, volume: 850, session: 'after-hours' }
  ];

  // Mock expiry dates (standard forex option expiries)
  const expiryDates = [
    { date: '2024-07-26', label: '1w', type: 'weekly' },
    { date: '2024-08-02', label: '2w', type: 'weekly' },
    { date: '2024-08-30', label: '1m', type: 'monthly' },
    { date: '2024-09-30', label: '2m', type: 'monthly' },
    { date: '2024-12-30', label: '5m', type: 'quarterly' }
  ];

  // Mock forex options chain
  const optionsChain = [
    // Calls
    { type: 'call', strike: 1.0750, bid: 0.0125, ask: 0.0135, last: 0.0130, volume: 2847, oi: 15934, iv: 0.125, delta: 0.85, gamma: 18.5, theta: -0.025, vega: 0.15 },
    { type: 'call', strike: 1.0800, bid: 0.0089, ask: 0.0095, last: 0.0092, volume: 3256, oi: 22847, iv: 0.135, delta: 0.78, gamma: 22.1, theta: -0.028, vega: 0.18 },
    { type: 'call', strike: 1.0850, bid: 0.0055, ask: 0.0062, last: 0.0058, volume: 4892, oi: 28765, iv: 0.148, delta: 0.68, gamma: 25.4, theta: -0.032, vega: 0.22 },
    { type: 'call', strike: 1.0875, bid: 0.0038, ask: 0.0045, last: 0.0041, volume: 5647, oi: 33891, iv: 0.155, delta: 0.58, gamma: 26.8, theta: -0.034, vega: 0.24 },
    { type: 'call', strike: 1.0900, bid: 0.0025, ask: 0.0032, last: 0.0028, volume: 4235, oi: 29234, iv: 0.168, delta: 0.48, gamma: 25.2, theta: -0.033, vega: 0.23 },
    { type: 'call', strike: 1.0950, bid: 0.0012, ask: 0.0018, last: 0.0015, volume: 2187, oi: 18456, iv: 0.185, delta: 0.32, gamma: 19.8, theta: -0.028, vega: 0.19 },
    // Puts
    { type: 'put', strike: 1.0750, bid: 0.0008, ask: 0.0015, last: 0.0011, volume: 1856, oi: 12789, iv: 0.118, delta: -0.15, gamma: 18.5, theta: -0.022, vega: 0.13 },
    { type: 'put', strike: 1.0800, bid: 0.0018, ask: 0.0025, last: 0.0021, volume: 2534, oi: 16876, iv: 0.128, delta: -0.22, gamma: 22.1, theta: -0.025, vega: 0.16 },
    { type: 'put', strike: 1.0850, bid: 0.0035, ask: 0.0042, last: 0.0038, volume: 3947, oi: 23234, iv: 0.141, delta: -0.32, gamma: 25.4, theta: -0.029, vega: 0.20 },
    { type: 'put', strike: 1.0875, bid: 0.0048, ask: 0.0055, last: 0.0051, volume: 4821, oi: 30145, iv: 0.148, delta: -0.42, gamma: 26.8, theta: -0.031, vega: 0.22 },
    { type: 'put', strike: 1.0900, bid: 0.0065, ask: 0.0072, last: 0.0068, volume: 3692, oi: 26789, iv: 0.161, delta: -0.52, gamma: 25.2, theta: -0.030, vega: 0.21 },
    { type: 'put', strike: 1.0950, bid: 0.0105, ask: 0.0112, last: 0.0108, volume: 1987, oi: 21234, iv: 0.178, delta: -0.68, gamma: 19.8, theta: -0.025, vega: 0.17 }
  ];

  const currentPair = forexPairs.find(pair => pair.symbol === selectedPair);
  const calls = optionsChain.filter(option => option.type === 'call');
  const puts = optionsChain.filter(option => option.type === 'put');

  // Check forex market hours (simplified - forex is 24/5)
  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    // Forex closes Friday 5 PM EST and opens Sunday 5 PM EST
    const isWeekend = (day === 6) || (day === 0 && hour < 17) || (day === 5 && hour >= 17);
    
    setIsForexMarketOpen(!isWeekend);
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
      case 'wellington': return '#8b5cf6';
      case 'sydney': return '#06b6d4';
      case 'tokyo': return '#ef4444';
      case 'london-open': return '#f59e0b';
      case 'london': return '#10b981';
      case 'new-york': return '#3b82f6';
      case 'after-hours': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatPips = (value, pipSize) => {
    const pips = Math.abs(value) / pipSize;
    return `${pips.toFixed(1)} pips`;
  };

  const getCentralBankFlag = (currency) => {
    const flags = {
      'EUR': '🇪🇺', 'USD': '🇺🇸', 'GBP': '🇬🇧', 
      'JPY': '🇯🇵', 'AUD': '🇦🇺', 'CHF': '🇨🇭', 'CAD': '🇨🇦'
    };
    return flags[currency] || '🏦';
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
                Forex Options Trading
              </h1>
              <p className="text-gray-400 mt-1">
                Professional forex options with low volatility and institutional strategies • 24/5 Market
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Market Session Status */}
              <div className="flex items-center space-x-2 bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-500/20">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-300 text-sm font-medium">
                  {currentPair.session} Session Active
                </span>
              </div>
              
              {/* Forex Market Status */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                isForexMarketOpen 
                  ? 'bg-blue-900/30 border-blue-500/20' 
                  : 'bg-red-900/30 border-red-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isForexMarketOpen ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  isForexMarketOpen ? 'text-blue-300' : 'text-red-300'
                }`}>
                  Forex Market {isForexMarketOpen ? 'Open (24/5)' : 'Closed (Weekend)'}
                </span>
              </div>
            </div>
          </div>

          {/* Forex Market Advantage Banner */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-center space-x-4 text-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-300 font-medium">💡 FOREX ADVANTAGE: Lower volatility, institutional-grade strategies, central bank events!</span>
              </div>
            </div>
          </div>

          {/* Currency Pair Selector */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
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
                      <span className="text-xs text-gray-400">{pair.session}</span>
                    </div>
                    <div className="text-sm text-gray-300 mt-0.5">{pair.name}</div>
                    <div className="text-2xl font-bold mt-1">{pair.price.toFixed(4)}</div>
                    <div className={`text-sm ${pair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(4)} ({pair.change >= 0 ? '+' : ''}{pair.changePercent}%)
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Vol: {pair.volatility}% • Spread: {pair.spread} pips
                    </div>
                    <div className="text-xs text-blue-400 mt-1 flex items-center space-x-1">
                      <span>{getCentralBankFlag(pair.symbol.split('/')[0])}</span>
                      <span>{pair.nextEvent}: {pair.eventDate}</span>
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
              
              {/* Price Chart with Market Sessions */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{selectedPair} - Global Trading Sessions</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Forex trades 24/5 across global financial centers with varying liquidity
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
                        labelFormatter={(value, payload) => {
                          const session = payload?.[0]?.payload?.session || '';
                          const sessionNames = {
                            'wellington': 'Wellington',
                            'sydney': 'Sydney', 
                            'tokyo': 'Tokyo',
                            'london-open': 'London Open',
                            'london': 'London',
                            'new-york': 'New York',
                            'after-hours': 'After Hours'
                          };
                          return `${value} (${sessionNames[session] || session})`;
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
                
                {/* Session Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('wellington')}}></div>
                    <span className="text-gray-300">Wellington (17:00-02:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('sydney')}}></div>
                    <span className="text-gray-300">Sydney (22:00-07:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('tokyo')}}></div>
                    <span className="text-gray-300">Tokyo (00:00-09:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('london')}}></div>
                    <span className="text-gray-300">London (08:00-17:00)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: getSessionColor('new-york')}}></div>
                    <span className="text-gray-300">New York (13:00-22:00)</span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Daily High:</span>
                    <span className="text-green-400 ml-2 font-medium">{(currentPair.price + 0.0045).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Daily Low:</span>
                    <span className="text-red-400 ml-2 font-medium">{(currentPair.price - 0.0038).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">ATR:</span>
                    <span className="text-white ml-2 font-medium">{formatPips(0.0085, currentPair.pip)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Spread:</span>
                    <span className="text-blue-400 ml-2 font-medium">{currentPair.spread} pips</span>
                  </div>
                </div>
              </div>

              {/* Options Chain */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                  <h3 className="text-xl font-bold">FX Options Chain</h3>
                  
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
                              Math.abs(option.strike - currentPair.price) < 0.005 ? 'bg-yellow-500/10 border border-yellow-500/30' : ''
                            } ${
                              option.strike < currentPair.price ? 'bg-green-500/5' : 'bg-gray-900/30'
                            }`}
                          >
                            <span className="font-medium text-white">{option.strike.toFixed(4)}</span>
                            <span className="text-green-400">{option.bid.toFixed(4)}</span>
                            <span className="text-red-400">{option.ask.toFixed(4)}</span>
                            <span className="text-white">{option.last.toFixed(4)}</span>
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
                              Math.abs(option.strike - currentPair.price) < 0.005 ? 'bg-yellow-500/10 border border-yellow-500/30' : ''
                            } ${
                              option.strike > currentPair.price ? 'bg-red-500/5' : 'bg-gray-900/30'
                            }`}
                          >
                            <span className="font-medium text-white">{option.strike.toFixed(4)}</span>
                            <span className="text-green-400">{option.bid.toFixed(4)}</span>
                            <span className="text-red-400">{option.ask.toFixed(4)}</span>
                            <span className="text-white">{option.last.toFixed(4)}</span>
                            <span className="text-gray-300">{option.volume}</span>
                            <span className="text-blue-400">{(option.iv * 100).toFixed(0)}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  💡 Click any option to trade • Green = ITM • ATM options highlighted in yellow • Lower volatility than stocks/crypto
                </div>
              </div>
            </div>

            {/* Trading Panel */}
            <div className="space-y-6">
              
              {/* Pair Stats */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Pair Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Rate:</span>
                    <span className="text-white font-medium">{currentPair.price.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Change:</span>
                    <span className={`font-medium ${currentPair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPips(currentPair.change, currentPair.pip)} ({currentPair.change >= 0 ? '+' : ''}{currentPair.changePercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Implied Vol:</span>
                    <span className="text-yellow-400 font-medium">{currentPair.volatility}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume:</span>
                    <span className="text-white font-medium">{currentPair.volume24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spread:</span>
                    <span className="text-blue-400 font-medium">{currentPair.spread} pips</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Session:</span>
                    <span className="text-green-400 font-medium">{currentPair.session}</span>
                  </div>
                </div>
              </div>

              {/* Strategy Builder */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">FX Options Strategies</h3>
                
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
                      <option value="calendar-spread">Calendar Spread</option>
                    </select>
                  </div>

                  {/* Quick Strategy Buttons */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-400 font-medium">Quick FX Strategies:</div>
                    
                    {/* Directional Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('long-call')}
                        className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Buy Call</div>
                          <div className="text-xs opacity-80">Currency Strength</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('long-put')}
                        className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Buy Put</div>
                          <div className="text-xs opacity-80">Currency Weakness</div>
                        </div>
                      </button>
                    </div>

                    {/* Central Bank Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('long-straddle')}
                        className="bg-gradient-to-r from-yellow-600 to-orange-600 p-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Rate Decision</div>
                          <div className="text-xs opacity-80">Central Bank Event</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('iron-condor')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Range Trading</div>
                          <div className="text-xs opacity-80">Low Volatility</div>
                        </div>
                      </button>
                    </div>

                    {/* Carry Trade Strategies */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedStrategy('bull-spread')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Carry Trade</div>
                          <div className="text-xs opacity-80">Interest Rate Play</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedStrategy('calendar-spread')}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                      >
                        <div className="text-center">
                          <div className="font-medium">Time Decay</div>
                          <div className="text-xs opacity-80">Theta Strategy</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Strategy Description */}
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-400">
                      {selectedStrategy === 'long-call' && '📈 Buy call to profit from currency strength. Perfect for hawkish central bank expectations.'}
                      {selectedStrategy === 'long-put' && '📉 Buy put to profit from currency weakness. Great for dovish policy or economic concerns.'}
                      {selectedStrategy === 'bull-spread' && '🎯 Limited risk play on moderate currency strength. Ideal for carry trade setups.'}
                      {selectedStrategy === 'bear-spread' && '🎯 Profit from moderate currency decline. Good for tapering or rate cut scenarios.'}
                      {selectedStrategy === 'long-straddle' && '⚡ Perfect for central bank meetings when big moves expected in either direction.'}
                      {selectedStrategy === 'long-strangle' && '⚡ Lower cost volatility play for rate decisions with uncertain outcomes.'}
                      {selectedStrategy === 'iron-condor' && '🏠 Range-bound strategy for stable currency pairs during low volatility periods.'}
                      {selectedStrategy === 'calendar-spread' && '⏰ Time decay strategy profiting from declining volatility after events.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Panel */}
              {showOrderPanel && selectedOption && (
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">FX Option Order</h3>
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
                        <span className="text-white font-medium">{selectedOption.ask.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Premium:</span>
                        <span className="text-white font-medium">${(selectedOption.ask * quantity * 100000).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Notional Value:</span>
                        <span className="text-blue-400 font-medium">${(quantity * 100000).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Breakeven:</span>
                        <span className="text-white font-medium">
                          {selectedOption.type === 'call' 
                            ? (selectedOption.strike + selectedOption.ask).toFixed(4)
                            : (selectedOption.strike - selectedOption.ask).toFixed(4)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Breakeven Pips:</span>
                        <span className="text-yellow-400 font-medium">
                          {formatPips(selectedOption.ask, currentPair.pip)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Risk:</span>
                        <span className="text-red-400 font-medium">${(selectedOption.ask * quantity * 100000).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400">Delta</div>
                        <div className="font-medium">{selectedOption.delta.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Gamma</div>
                        <div className="font-medium">{selectedOption.gamma.toFixed(1)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Theta</div>
                        <div className="font-medium">{selectedOption.theta.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Vega</div>
                        <div className="font-medium">{selectedOption.vega.toFixed(2)}</div>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-medium">
                      Buy {selectedOption.type.toUpperCase()} • ${(selectedOption.ask * quantity * 100000).toFixed(2)}
                    </button>

                    <div className="text-xs text-gray-400 mt-2 text-center">
                      💡 FX options with institutional-grade execution • Cash settlement in USD
                    </div>
                  </div>
                </div>
              )}

              {/* Central Bank Calendar */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Central Bank Events</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getCentralBankFlag('EUR')}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">ECB Rate Decision</div>
                      <div className="text-sm text-gray-400">July 25, 2024 • Current: 4.25%</div>
                      <div className="text-xs text-yellow-400">Expected: No change • Hawkish tone likely</div>
                    </div>
                    <div className="text-green-400 text-sm font-medium">Tomorrow</div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getCentralBankFlag('GBP')}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">BoE Meeting</div>
                      <div className="text-sm text-gray-400">August 1, 2024 • Current: 5.25%</div>
                      <div className="text-xs text-blue-400">Expected: -25bps cut • Dovish shift</div>
                    </div>
                    <div className="text-blue-400 text-sm font-medium">1 week</div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getCentralBankFlag('JPY')}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">BoJ Statement</div>
                      <div className="text-sm text-gray-400">July 31, 2024 • Current: 0.10%</div>
                      <div className="text-xs text-orange-400">Expected: Yield curve control changes</div>
                    </div>
                    <div className="text-orange-400 text-sm font-medium">6 days</div>
                  </div>
                </div>
              </div>

              {/* Forex Trading Highlights */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Forex Advantages</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Lower volatility than crypto/stocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">24/5 global market access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Central bank event strategies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Interest rate differential plays</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">High liquidity, tight spreads</span>
                  </div>
                </div>
              </div>

              {/* P&L Calculator */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Pip Profit Calculator</h3>
                
                {selectedOption && (
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
                          const pipMove = Math.abs(price - currentPair.price) / currentPair.pip;
                          e.target.nextElementSibling.textContent = `${price.toFixed(4)}`;
                          e.target.parentElement.nextElementSibling.children[1].textContent = 
                            `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;
                          e.target.parentElement.nextElementSibling.children[1].className = 
                            `font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
                          e.target.parentElement.nextElementSibling.children[3].textContent = 
                            `${pipMove.toFixed(1)} pips ${price > currentPair.price ? 'up' : 'down'}`;
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
                      <div className="text-xs text-gray-400 mt-2">
                        Based on {quantity} contract(s) • $100K notional each
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

          {/* Recent Activity & Economic Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent FX Options Activity */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Recent FX Options Activity</h3>
              
              <div className="space-y-3">
                {[
                  { pair: 'EUR/USD', type: 'Call', strike: '1.0900', size: '5', price: '0.0028', time: '2m ago', status: 'buy', event: 'ECB Decision' },
                  { pair: 'GBP/USD', type: 'Put', strike: '1.2850', size: '3', price: '0.0045', time: '7m ago', status: 'sell', event: 'BoE Meeting' },
                  { pair: 'USD/JPY', type: 'Straddle', strike: '157.00', size: '2', price: '0.95', time: '15m ago', status: 'buy', event: 'BoJ Statement' },
                  { pair: 'AUD/USD', type: 'Call', strike: '0.6700', size: '8', price: '0.0032', time: '22m ago', status: 'buy', event: 'RBA Decision' },
                  { pair: 'USD/CHF', type: 'Iron Condor', strike: '0.8900', size: '4', price: '0.0018', time: '28m ago', status: 'sell', event: 'Range Trade' }
                ].map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${trade.status === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.pair}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            trade.type === 'Call' ? 'bg-green-500/20 text-green-400' : 
                            trade.type === 'Put' ? 'bg-red-500/20 text-red-400' :
                            trade.type === 'Straddle' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {trade.type}
                          </span>
                          <span className="text-gray-300 text-sm">{trade.strike}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {trade.size} contracts • {trade.time} • {trade.event}
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
                View All FX Activity →
              </button>
            </div>

            {/* Economic Calendar & Analysis */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Economic Calendar & Analysis</h3>
              
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-red-400 font-medium text-sm">HIGH IMPACT TODAY</div>
                      <div className="text-white text-sm mt-1">
                        🇺🇸 US GDP Q2 (14:30 UTC) - Expected: 2.1% vs 1.4% prior
                      </div>
                      <div className="text-gray-400 text-xs mt-2">Major USD volatility expected across all pairs</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-yellow-400 font-medium text-sm">ECB RATE DECISION</div>
                      <div className="text-white text-sm mt-1">
                        🇪🇺 Tomorrow 12:15 UTC - Current rate: 4.25%
                      </div>
                      <div className="text-gray-400 text-xs mt-2">No change expected • Focus on forward guidance</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-blue-400 font-medium text-sm">VOLATILITY SPIKE</div>
                      <div className="text-white text-sm mt-1">
                        GBP pairs showing elevated IV ahead of BoE meeting next week
                      </div>
                      <div className="text-gray-400 text-xs mt-2">Consider straddle strategies on GBP/USD</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="text-green-400 font-medium text-sm">CARRY TRADE OPPORTUNITY</div>
                      <div className="text-white text-sm mt-1">
                        USD/JPY rate differential at 4.15% - highest in 20 years
                      </div>
                      <div className="text-gray-400 text-xs mt-2">Consider long-term call spreads</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forex Trading Advantage Banner */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-xl border border-blue-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  💱 Professional Forex Options Trading
                </h3>
                <p className="text-gray-300 mt-2">
                  Trade the world's largest financial market with institutional-grade options strategies. 
                  Lower volatility, higher liquidity, and central bank-driven opportunities.
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">24/5 Global Trading</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300">$100K Standard Contracts</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">Central Bank Events</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-300">Interest Rate Strategies</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">$6.6T</div>
                  <div className="text-xs text-gray-400">Daily Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">24/5</div>
                  <div className="text-xs text-gray-400">Market Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">Low</div>
                  <div className="text-xs text-gray-400">Volatility</div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Schedule */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Global Trading Sessions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-purple-300">Wellington</span>
                </div>
                <div className="text-sm text-gray-300">17:00 - 02:00 UTC</div>
                <div className="text-xs text-gray-400 mt-1">Low liquidity, range-bound</div>
              </div>
              
              <div className="bg-cyan-900/30 p-4 rounded-lg border border-cyan-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <span className="font-medium text-cyan-300">Sydney</span>
                </div>
                <div className="text-sm text-gray-300">22:00 - 07:00 UTC</div>
                <div className="text-xs text-gray-400 mt-1">AUD pairs active</div>
              </div>
              
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-300">Tokyo</span>
                </div>
                <div className="text-sm text-gray-300">00:00 - 09:00 UTC</div>
                <div className="text-xs text-gray-400 mt-1">JPY pairs, moderate volume</div>
              </div>
              
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-300">London</span>
                </div>
                <div className="text-sm text-gray-300">08:00 - 17:00 UTC</div>
                <div className="text-xs text-gray-400 mt-1">Highest volume, all pairs</div>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-900/30 p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-300">New York</span>
              </div>
              <div className="text-sm text-gray-300">13:00 - 22:00 UTC</div>
              <div className="text-xs text-gray-400 mt-1">
                Overlaps with London (13:00-17:00) = Peak liquidity and volatility
              </div>
            </div>
          </div>

          {/* Interest Rate Dashboard */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Interest Rate Dashboard</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { currency: 'USD', rate: 5.50, change: 0, flag: '🇺🇸', nextMeeting: 'Sep 18' },
                { currency: 'EUR', rate: 4.25, change: 0, flag: '🇪🇺', nextMeeting: 'Jul 25' },
                { currency: 'GBP', rate: 5.25, change: -0.25, flag: '🇬🇧', nextMeeting: 'Aug 1' },
                { currency: 'JPY', rate: 0.10, change: +0.10, flag: '🇯🇵', nextMeeting: 'Jul 31' },
                { currency: 'AUD', rate: 4.35, change: 0, flag: '🇦🇺', nextMeeting: 'Aug 6' },
                { currency: 'CAD', rate: 5.00, change: -0.25, flag: '🇨🇦', nextMeeting: 'Jul 24' }
              ].map((country, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">{country.flag}</div>
                  <div className="font-bold text-lg text-white">{country.currency}</div>
                  <div className="text-2xl font-bold text-blue-400">{country.rate}%</div>
                  <div className={`text-sm ${
                    country.change > 0 ? 'text-green-400' : 
                    country.change < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {country.change > 0 ? '+' : ''}{country.change.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{country.nextMeeting}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-xs text-gray-400 text-center">
              💡 Interest rate differentials drive carry trades and long-term FX trends
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexTradingScreen;