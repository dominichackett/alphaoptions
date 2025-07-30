'use client'
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import OptionsHeader from '../components/Header/Header';

export default function PortfolioPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [sortBy, setSortBy] = useState('pnl');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock portfolio data
  const portfolioValue = 155280;
  const todayPnL = 3850;
  const totalPnL = 42780;
  const todayPnLPercent = 2.54;
  const totalPnLPercent = 38.1;

  // Performance data for chart
  const performanceData = [
    { date: '2024-01', value: 112500, pnl: 12500 },
    { date: '2024-02', value: 118750, pnl: 6250 },
    { date: '2024-03', value: 125200, pnl: 6450 },
    { date: '2024-04', value: 132800, pnl: 7600 },
    { date: '2024-05', value: 139500, pnl: 6700 },
    { date: '2024-06', value: 145200, pnl: 5700 },
    { date: '2024-07', value: 155280, pnl: 10080 }
  ];

  // Greeks exposure data
  const greeksData = [
    { name: 'Delta', value: 0.72, color: '#3b82f6' },
    { name: 'Gamma', value: 0.15, color: '#8b5cf6' },
    { name: 'Theta', value: -0.05, color: '#ef4444' },
    { name: 'Vega', value: 0.28, color: '#10b981' }
  ];

  // Detailed positions
  const positions = [
    {
      id: 1,
      asset: 'ETH',
      type: 'Call',
      strike: '$3000',
      expiry: '2024-08-30',
      quantity: 5,
      premium: '0.05 ETH',
      currentValue: '$1,250',
      pnl: '+$325',
      pnlPercent: '+35.2%',
      status: 'ITM',
      delta: 0.78,
      gamma: 0.12,
      theta: -0.03,
      vega: 0.25,
      daysToExpiry: 30,
      impliedVol: '68.5%'
    },
    {
      id: 2,
      asset: 'AAPL',
      type: 'Put',
      strike: '$180',
      expiry: '2024-08-15',
      quantity: 10,
      premium: '$2.50',
      currentValue: '$1,800',
      pnl: '-$700',
      pnlPercent: '-28.0%',
      status: 'OTM',
      delta: -0.35,
      gamma: 0.08,
      theta: -0.04,
      vega: 0.15,
      daysToExpiry: 15,
      impliedVol: '32.1%'
    },
    {
      id: 3,
      asset: 'EUR/USD',
      type: 'Call',
      strike: '1.1050',
      expiry: '2024-08-07',
      quantity: 20,
      premium: '$150',
      currentValue: '$2,850',
      pnl: '+$850',
      pnlPercent: '+42.5%',
      status: 'ITM',
      delta: 0.65,
      gamma: 0.18,
      theta: -0.08,
      vega: 0.12,
      daysToExpiry: 7,
      impliedVol: '12.3%'
    },
    {
      id: 4,
      asset: 'TSLA',
      type: 'Call',
      strike: '$250',
      expiry: '2024-09-15',
      quantity: 3,
      premium: '$8.25',
      currentValue: '$3,450',
      pnl: '+$1,275',
      pnlPercent: '+58.6%',
      status: 'ITM',
      delta: 0.82,
      gamma: 0.09,
      theta: -0.02,
      vega: 0.31,
      daysToExpiry: 45,
      impliedVol: '45.8%'
    },
    {
      id: 5,
      asset: 'BTC',
      type: 'Put',
      strike: '$65000',
      expiry: '2024-08-25',
      quantity: 2,
      premium: '0.02 BTC',
      currentValue: '$2,100',
      pnl: '+$480',
      pnlPercent: '+29.6%',
      status: 'ATM',
      delta: -0.48,
      gamma: 0.14,
      theta: -0.06,
      vega: 0.22,
      daysToExpiry: 25,
      impliedVol: '58.2%'
    }
  ];

  // Filter and sort positions
  const filteredPositions = positions
    .filter(position => {
      if (filterStatus === 'all') return true;
      return position.status.toLowerCase() === filterStatus.toLowerCase();
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return parseFloat(b.pnlPercent) - parseFloat(a.pnlPercent);
        case 'expiry':
          return a.daysToExpiry - b.daysToExpiry;
        case 'asset':
          return a.asset.localeCompare(b.asset);
        case 'value':
          return parseFloat(b.currentValue.replace(/[$,]/g, '')) - parseFloat(a.currentValue.replace(/[$,]/g, ''));
        default:
          return 0;
      }
    });

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Market status helper
  const getMarketStatus = () => {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    
    return {
      crypto: { status: 'Open', color: 'text-green-400' },
      stocks: { 
        status: (day >= 1 && day <= 5 && hour >= 14 && hour < 21) ? 'Open' : 'Closed',
        color: (day >= 1 && day <= 5 && hour >= 14 && hour < 21) ? 'text-green-400' : 'text-red-400'
      },
      forex: { 
        status: (day !== 0 && !(day === 6 && hour >= 22)) ? 'Open' : 'Closed',
        color: (day !== 0 && !(day === 6 && hour >= 22)) ? 'text-green-400' : 'text-red-400'
      }
    };
  };

  const marketStatus = getMarketStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      {/* Header */}
      <OptionsHeader />
      
      {/* Portfolio Content */}
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Portfolio Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Portfolio Overview
              </h1>
              <p className="text-gray-400 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • {currentTime.toLocaleTimeString('en-US')}
              </p>
            </div>
            
            {/* Portfolio Value Display */}
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 px-6 py-4 rounded-lg border border-green-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">${portfolioValue.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Total Portfolio Value</div>
                <div className={`text-sm font-medium ${todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {todayPnL >= 0 ? '+' : ''}${todayPnL.toLocaleString()} ({todayPnL >= 0 ? '+' : ''}{todayPnLPercent}%) Today
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-6 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Total P&L</p>
                  <p className="text-2xl font-bold text-white mt-1">${totalPnL.toLocaleString()}</p>
                  <p className="text-green-400 text-sm mt-1">+{totalPnLPercent}% All Time</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-6 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Open Positions</p>
                  <p className="text-2xl font-bold text-white mt-1">{positions.length}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {positions.filter(p => p.status === 'ITM').length} ITM • 
                    {positions.filter(p => p.status === 'OTM').length} OTM • 
                    {positions.filter(p => p.status === 'ATM').length} ATM
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Portfolio Delta</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {positions.reduce((sum, pos) => sum + pos.delta, 0).toFixed(2)}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Net directional exposure</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 p-6 rounded-xl border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Expiring Soon</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {positions.filter(p => p.daysToExpiry <= 7).length}
                  </p>
                  <p className="text-orange-400 text-sm mt-1">Within 7 days</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Portfolio Performance Chart */}
            <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Portfolio Performance</h3>
                <div className="flex items-center space-x-2">
                  {['7d', '30d', '90d', '1y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimeframe(period)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        selectedTimeframe === period
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#portfolioGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Greeks Exposure */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Greeks Exposure</h3>
              <div className="space-y-4">
                {greeksData.map((greek, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                  <span className="text-gray-300">VaR (95%)</span>
                  <span className="text-orange-400 font-medium">$4,280</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Correlation to Market</span>
                  <span className="text-white font-medium">0.72</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Expiry Calendar</h3>
              <div className="space-y-3">
                {positions
                  .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
                  .map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          position.daysToExpiry <= 7 ? 'bg-red-500' :
                          position.daysToExpiry <= 30 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <div>
                          <div className="text-white font-medium">{position.asset} {position.strike} {position.type}</div>
                          <div className="text-xs text-gray-400">{position.expiry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{position.daysToExpiry}d</div>
                        <div className={`text-xs ${
                          position.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnlPercent}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Portfolio Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <div className="font-medium">Add Position</div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                  <div className="font-medium">Rebalance</div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="font-medium">Hedge Risk</div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="font-medium">Export Report</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                      <span className="text-gray-300 font-medium">{greek.name}</span>
                      <span className="text-white font-bold">{greek.value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          backgroundColor: greek.color,
                          width: `${Math.abs(greek.value) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {greek.name === 'Delta' && 'Directional exposure'}
                      {greek.name === 'Gamma' && 'Delta sensitivity'}
                      {greek.name === 'Theta' && 'Time decay per day'}
                      {greek.name === 'Vega' && 'Volatility sensitivity'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <h3 className="text-xl font-bold text-white">Open Positions</h3>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Filter:</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm border border-gray-600 focus:border-blue-500"
                  >
                    <option value="all">All Positions</option>
                    <option value="itm">In The Money</option>
                    <option value="otm">Out The Money</option>
                    <option value="atm">At The Money</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Sort by:</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm border border-gray-600 focus:border-blue-500"
                  >
                    <option value="pnl">P&L %</option>
                    <option value="expiry">Days to Expiry</option>
                    <option value="asset">Asset</option>
                    <option value="value">Current Value</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Asset</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Strike</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Expiry</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Qty</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Value</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">P&L</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Greeks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPositions.map((position) => (
                    <tr key={position.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{position.asset}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          position.type === 'Call' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {position.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{position.strike}</td>
                      <td className="py-4 px-4">
                        <div className="text-gray-300">{position.expiry.split('-').slice(1).join('/')}</div>
                        <div className="text-xs text-gray-400">{position.daysToExpiry}d left</div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{position.quantity}</td>
                      <td className="py-4 px-4 text-white font-medium">{position.currentValue}</td>
                      <td className="py-4 px-4">
                        <div className={`font-medium ${
                          position.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnl}
                        </div>
                        <div className={`text-xs ${
                          position.pnlPercent.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnlPercent}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          position.status === 'ITM' ? 'bg-green-500/20 text-green-400' :
                          position.status === 'OTM' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {position.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs space-y-1">
                          <div className="text-gray-300">Δ {position.delta}</div>
                          <div className="text-gray-400">Γ {position.gamma}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredPositions.map((position) => (
                <div key={position.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-white text-lg">{position.asset}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        position.type === 'Call' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {position.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        position.status === 'ITM' ? 'bg-green-500/20 text-green-400' :
                        position.status === 'OTM' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {position.status}
                      </span>
                    </div>
                    <div className={`text-right ${
                      position.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <div className="font-medium">{position.pnl}</div>
                      <div className="text-xs">{position.pnlPercent}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Strike • Expiry</div>
                      <div className="text-white">{position.strike} • {position.daysToExpiry}d</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Value • Qty</div>
                      <div className="text-white">{position.currentValue} • {position.quantity}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400">
                      Δ {position.delta} • Γ {position.gamma} • Θ {position.theta} • Ν {position.vega}
                    </div>
                    <div className="text-xs text-gray-400">
                      IV: {position.impliedVol}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Risk Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Portfolio Beta</span>
                  <span className="text-white font-medium">1.24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sharpe Ratio</span>
                  <span className="text-white font-medium">2.18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Drawdown</span>
                  <span className="text-red-400 font-medium">-8.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="text-green-400 font-medium">67.8%</span>
                </div>
                <div className="flex justify-between items-center"></div>