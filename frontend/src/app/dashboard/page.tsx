'use client'
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import OptionsHeader from '../components/Header/Header';

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [portfolioView, setPortfolioView] = useState('overview');

  // Mock data for charts
  const portfolioData = [
    { name: 'Jan', value: 42000, pnl: 2000 },
    { name: 'Feb', value: 45000, pnl: 3000 },
    { name: 'Mar', value: 43000, pnl: -2000 },
    { name: 'Apr', value: 48000, pnl: 5000 },
    { name: 'May', value: 52000, pnl: 4000 },
    { name: 'Jun', value: 55000, pnl: 3000 }
  ];

  const assetAllocation = [
    { name: 'Crypto Options', value: 45, color: '#f59e0b' },
    { name: 'Stock Options', value: 35, color: '#3b82f6' },
    { name: 'Forex Options', value: 20, color: '#10b981' }
  ];

  const recentTrades = [
    { id: 1, asset: 'ETH', type: 'Call', strike: '$3000', expiry: '30d', premium: '0.05 ETH', status: 'Open', pnl: '+$125' },
    { id: 2, asset: 'AAPL', type: 'Put', strike: '$180', expiry: '15d', premium: '$2.50', status: 'Open', pnl: '-$45' },
    { id: 3, asset: 'EUR/USD', type: 'Call', strike: '1.1050', expiry: '7d', premium: '$150', status: 'Closed', pnl: '+$75' },
    { id: 4, asset: 'TSLA', type: 'Call', strike: '$250', expiry: '45d', premium: '$8.25', status: 'Open', pnl: '+$340' }
  ];

  const marketData = [
    { symbol: 'ETH/USD', price: '$2,487.50', change: '+2.4%', vol: 'High' },
    { symbol: 'AAPL', price: '$182.15', change: '-0.8%', vol: 'Medium' },
    { symbol: 'EUR/USD', price: '1.1045', change: '+0.2%', vol: 'Low' },
    { symbol: 'TSLA', price: '$248.75', change: '+3.1%', vol: 'High' }
  ];

  // Update time every second
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
      
      {/* Dashboard Content */}
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Trading Dashboard
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
            
            {/* Market Status Indicators */}
            <div className="flex items-center space-x-6 bg-gray-800/50 px-6 py-3 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">CRYPTO</span>
                <span className={`text-xs font-medium ${marketStatus.crypto.color}`}>24/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${marketStatus.stocks.status === 'Open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">STOCKS</span>
                <span className={`text-xs font-medium ${marketStatus.stocks.color}`}>{marketStatus.stocks.status}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${marketStatus.forex.status === 'Open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">FOREX</span>
                <span className={`text-xs font-medium ${marketStatus.forex.color}`}>{marketStatus.forex.status}</span>
              </div>
              <div className="text-xs text-gray-400">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  timeZone: 'UTC',
                  hour: '2-digit',
                  minute: '2-digit'
                })} UTC
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-6 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white mt-1">$55,280</p>
                  <p className="text-green-400 text-sm mt-1">+$3,280 (+6.3%) Today</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-6 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Open Positions</p>
                  <p className="text-2xl font-bold text-white mt-1">12</p>
                  <p className="text-gray-400 text-sm mt-1">4 ITM • 6 OTM • 2 ATM</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Greeks Exposure</p>
                  <p className="text-2xl font-bold text-white mt-1">Δ 0.72</p>
                  <p className="text-gray-400 text-sm mt-1">Γ 0.15 • Θ -0.05 • Ν 0.28</p>
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
                  <p className="text-orange-300 text-sm font-medium">24h Volume</p>
                  <p className="text-2xl font-bold text-white mt-1">$127K</p>
                  <p className="text-orange-400 text-sm mt-1">+15.2% vs Yesterday</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
                  {['24h', '7d', '30d', '90d'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimeframe(period)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        selectedTimeframe === period
                          ? 'bg-blue-500 text-white'
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
                  <LineChart data={portfolioData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
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
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Asset Allocation</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {assetAllocation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-300 text-sm">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity and Market Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Trades */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Trades</h3>
                <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.asset}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.type === 'Call' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Strike: {trade.strike} • {trade.expiry}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-300">{trade.premium}</div>
                      <div className={`text-sm font-medium ${
                        trade.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.pnl}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Overview */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Market Overview</h3>
                <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  View Markets
                </button>
              </div>
              <div className="space-y-4">
                {marketData.map((market, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                    <div>
                      <div className="font-medium text-white">{market.symbol}</div>
                      <div className="text-2xl font-bold text-white">{market.price}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        market.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {market.change}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded mt-1 ${
                        market.vol === 'High' ? 'bg-red-500/20 text-red-400' :
                        market.vol === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {market.vol} Vol
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Quick Trading Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/trade/crypto" className="bg-gradient-to-r from-orange-600 to-yellow-600 p-4 rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all transform hover:scale-105 block text-center">
                <div className="text-3xl mb-2">₿</div>
                <div className="font-medium text-white">Crypto Options</div>
                <div className="text-xs text-gray-200 mt-1">ETH, BTC, LINK</div>
                <div className="text-xs text-green-400 mt-1 font-semibold">24/7 Trading</div>
              </a>
              
              <a href="/trade/stocks" className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 block text-center">
                <div className="text-3xl mb-2">📈</div>
                <div className="font-medium text-white">Stock Options</div>
                <div className="text-xs text-gray-200 mt-1">AAPL, TSLA, MSFT</div>
                <div className="text-xs text-purple-400 mt-1 font-semibold">24/7* Trading</div>
              </a>
              
              <a href="/trade/forex" className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 block text-center">
                <div className="text-3xl mb-2">💱</div>
                <div className="font-medium text-white">Forex Options</div>
                <div className="text-xs text-gray-200 mt-1">EUR/USD, GBP/USD</div>
                <div className="text-xs text-gray-400 mt-1 font-semibold">24/5 Trading</div>
              </a>
              
              <a href="/strategies" className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 block text-center">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="font-medium text-white">Strategy Builder</div>
                  <div className="text-xs text-gray-200 mt-1">Build custom strategies</div>
                  <div className="text-xs text-pink-400 mt-1 font-semibold">Multi-leg Options</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}