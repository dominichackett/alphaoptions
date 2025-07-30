'use client'
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import OptionsHeader from '../components/Header/Header';

export default function AnalyticsPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState('returns');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [viewMode, setViewMode] = useState('overview');

  // Performance analytics data
  const performanceData = [
    { month: 'Jan', returns: 12.5, benchmark: 8.2, volatility: 15.3, sharpe: 1.85 },
    { month: 'Feb', returns: 8.7, benchmark: 6.1, volatility: 12.8, sharpe: 1.92 },
    { month: 'Mar', returns: -2.3, benchmark: -1.8, volatility: 18.2, sharpe: 1.45 },
    { month: 'Apr', returns: 15.2, benchmark: 9.7, volatility: 14.1, sharpe: 2.15 },
    { month: 'May', returns: 11.8, benchmark: 7.3, volatility: 13.5, sharpe: 2.08 },
    { month: 'Jun', returns: 9.4, benchmark: 5.9, volatility: 11.7, sharpe: 2.25 },
    { month: 'Jul', returns: 18.3, benchmark: 11.2, volatility: 16.8, sharpe: 2.42 }
  ];

  // Strategy performance breakdown
  const strategyData = [
    { name: 'Covered Calls', returns: 8.5, trades: 45, winRate: 78, avgReturn: 2.1, maxDrawdown: -3.2, color: '#10b981' },
    { name: 'Cash-Secured Puts', returns: 12.3, trades: 32, winRate: 72, avgReturn: 3.8, maxDrawdown: -5.7, color: '#3b82f6' },
    { name: 'Iron Condors', returns: 15.7, trades: 28, winRate: 68, avgReturn: 5.6, maxDrawdown: -8.1, color: '#8b5cf6' },
    { name: 'Straddles', returns: 22.1, trades: 18, winRate: 61, avgReturn: 12.3, maxDrawdown: -15.4, color: '#f59e0b' },
    { name: 'Bull Spreads', returns: 18.9, trades: 24, winRate: 75, avgReturn: 7.9, maxDrawdown: -6.8, color: '#ef4444' }
  ];

  // Risk metrics data
  const riskMetrics = [
    { metric: 'Risk Management', value: 85, color: '#10b981' },
    { metric: 'Diversification', value: 72, color: '#3b82f6' },
    { metric: 'Liquidity', value: 91, color: '#8b5cf6' },
    { metric: 'Volatility Control', value: 68, color: '#f59e0b' },
    { metric: 'Correlation', value: 79, color: '#ef4444' }
  ];

  // Greeks evolution data
  const greeksData = [
    { date: '2024-01', delta: 0.45, gamma: 0.12, theta: -0.08, vega: 0.23 },
    { date: '2024-02', delta: 0.52, gamma: 0.15, theta: -0.06, vega: 0.28 },
    { date: '2024-03', delta: 0.38, gamma: 0.09, theta: -0.12, vega: 0.19 },
    { date: '2024-04', delta: 0.61, gamma: 0.18, theta: -0.04, vega: 0.34 },
    { date: '2024-05', delta: 0.72, gamma: 0.21, theta: -0.05, vega: 0.31 },
    { date: '2024-06', delta: 0.68, gamma: 0.16, theta: -0.07, vega: 0.29 },
    { date: '2024-07', delta: 0.75, gamma: 0.19, theta: -0.03, vega: 0.33 }
  ];

  // Market correlation data
  const correlationData = [
    { asset: 'SPY', correlation: 0.72, volatility: 15.2, beta: 1.24 },
    { asset: 'QQQ', correlation: 0.68, volatility: 18.7, beta: 1.31 },
    { asset: 'VIX', correlation: -0.45, volatility: 82.3, beta: -0.89 },
    { asset: 'Gold', correlation: 0.23, volatility: 12.8, beta: 0.34 },
    { asset: 'USD Index', correlation: -0.18, volatility: 8.4, beta: -0.22 }
  ];

  // Profit factor analysis
  const profitFactorData = [
    { strategy: 'Covered Calls', profitFactor: 2.1, grossProfit: 8450, grossLoss: -4020, trades: 45 },
    { strategy: 'Iron Condors', profitFactor: 1.8, grossProfit: 12300, grossLoss: -6840, trades: 28 },
    { strategy: 'Straddles', profitFactor: 1.6, grossProfit: 18900, grossLoss: -11800, trades: 18 },
    { strategy: 'Bull Spreads', profitFactor: 2.3, grossProfit: 9870, grossLoss: -4290, trades: 24 }
  ];

  // Volatility surface data
  const volatilitySurface = [
    { strike: 90, days30: 18.2, days60: 16.8, days90: 15.4 },
    { strike: 95, days30: 16.5, days60: 15.2, days90: 14.1 },
    { strike: 100, days30: 15.1, days60: 14.3, days90: 13.2 },
    { strike: 105, days30: 16.8, days60: 15.7, days90: 14.5 },
    { strike: 110, days30: 19.3, days60: 17.9, days90: 16.2 }
  ];

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      {/* Header */}
      <OptionsHeader />
      
      {/* Analytics Content */}
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Analytics Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Advanced Analytics
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
            
            {/* View Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">View:</label>
                <select 
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:border-purple-500"
                >
                  <option value="overview">Overview</option>
                  <option value="performance">Performance</option>
                  <option value="risk">Risk Analysis</option>
                  <option value="strategies">Strategies</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">Period:</label>
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:border-purple-500"
                >
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-6 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Total Return</p>
                  <p className="text-2xl font-bold text-white mt-1">+38.2%</p>
                  <p className="text-green-400 text-sm mt-1">YTD Performance</p>
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
                  <p className="text-blue-300 text-sm font-medium">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-white mt-1">2.18</p>
                  <p className="text-blue-400 text-sm mt-1">Risk-adjusted return</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Win Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">72.5%</p>
                  <p className="text-purple-400 text-sm mt-1">Successful trades</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 p-6 rounded-xl border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Max Drawdown</p>
                  <p className="text-2xl font-bold text-white mt-1">-8.3%</p>
                  <p className="text-orange-400 text-sm mt-1">Worst loss period</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Performance vs Benchmark Chart */}
            <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Performance vs Benchmark</h3>
                <div className="flex items-center space-x-2">
                  {['returns', 'volatility', 'sharpe'].map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all capitalize ${
                        selectedMetric === metric
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
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
                      dataKey={selectedMetric}
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      name="Your Portfolio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark"
                      stroke="#6b7280" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
                      name="Benchmark"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Profile Radar */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Risk Profile</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riskMetrics}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    <Radar
                      name="Risk Score"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
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
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Strategy Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Strategy Returns Chart */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Strategy Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
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
                    <Bar dataKey="returns" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Greeks Evolution */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Greeks Evolution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={greeksData}>
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
                    <Line type="monotone" dataKey="delta" stroke="#3b82f6" strokeWidth={2} name="Delta" />
                    <Line type="monotone" dataKey="gamma" stroke="#10b981" strokeWidth={2} name="Gamma" />
                    <Line type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} name="Theta" />
                    <Line type="monotone" dataKey="vega" stroke="#f59e0b" strokeWidth={2} name="Vega" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Strategy Details Table */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Strategy Analysis</h3>
              <div className="space-y-4">
                {strategyData.map((strategy, index) => (
                  <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">{strategy.name}</h4>
                        <p className="text-sm text-gray-400">{strategy.trades} trades</p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium">+{strategy.returns}%</div>
                        <div className="text-xs text-gray-400">Win Rate: {strategy.winRate}%</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Avg Return</div>
                        <div className="text-white">{strategy.avgReturn}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Max DD</div>
                        <div className="text-red-400">{strategy.maxDrawdown}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Trades</div>
                        <div className="text-white">{strategy.trades}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            backgroundColor: strategy.color,
                            width: `${(strategy.winRate / 100) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Correlation Analysis */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Market Correlation</h3>
              <div className="space-y-4">
                {correlationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-white">{item.asset}</div>
                        <div className="text-sm text-gray-400">Beta: {item.beta}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        item.correlation > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.correlation > 0 ? '+' : ''}{item.correlation}
                      </div>
                      <div className="text-xs text-gray-400">Vol: {item.volatility}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Profit Factor Analysis */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Profit Factor</h3>
              <div className="space-y-4">
                {profitFactorData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{item.strategy}</span>
                      <span className="text-white font-bold">{item.profitFactor}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">+${item.grossProfit.toLocaleString()}</span>
                      <span className="text-red-400">${item.grossLoss.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full bg-gradient-to-r from-green-500 to-blue-500" 
                        style={{ width: `${Math.min((item.profitFactor / 3) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volatility Surface */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Volatility Surface</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volatilitySurface}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="strike" stroke="#9ca3af" />
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
                    <Line type="monotone" dataKey="days30" stroke="#ef4444" strokeWidth={2} name="30 Days" />
                    <Line type="monotone" dataKey="days60" stroke="#f59e0b" strokeWidth={2} name="60 Days" />
                    <Line type="monotone" dataKey="days90" stroke="#10b981" strokeWidth={2} name="90 Days" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Statistics */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Key Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Alpha</span>
                  <span className="text-green-400 font-medium">+0.078</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Beta</span>
                  <span className="text-white font-medium">1.24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Information Ratio</span>
                  <span className="text-blue-400 font-medium">1.85</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sortino Ratio</span>
                  <span className="text-purple-400 font-medium">2.94</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Calmar Ratio</span>
                  <span className="text-orange-400 font-medium">4.61</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">VaR (95%)</span>
                  <span className="text-red-400 font-medium">$4,280</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Expected Shortfall</span>
                  <span className="text-red-400 font-medium">$6,850</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tracking Error</span>
                  <span className="text-yellow-400 font-medium">3.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk-Return Scatter Plot */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Risk-Return Analysis</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    type="number" 
                    dataKey="volatility" 
                    name="Volatility %" 
                    stroke="#9ca3af"
                    label={{ value: 'Volatility (%)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="returns" 
                    name="Returns %" 
                    stroke="#9ca3af"
                    label={{ value: 'Returns (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value, name) => [
                      `${value}${name === 'returns' ? '%' : name === 'volatility' ? '%' : ''}`,
                      name === 'returns' ? 'Returns' : name === 'volatility' ? 'Volatility' : name
                    ]}
                  />
                  <Scatter 
                    name="Strategies" 
                    data={strategyData.map(s => ({ 
                      volatility: s.maxDrawdown * -1, 
                      returns: s.returns,
                      name: s.name 
                    }))} 
                    fill="#8b5cf6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Items and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Performance Insights */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Performance Insights</h3>
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-green-400 font-medium">Strong Performance</h4>
                      <p className="text-gray-300 text-sm mt-1">
                        Your portfolio is outperforming the benchmark by 12.4% with a Sharpe ratio of 2.18, 
                        indicating excellent risk-adjusted returns.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-yellow-400 font-medium">Concentration Risk</h4>
                      <p className="text-gray-300 text-sm mt-1">
                        72% of your returns come from just 2 strategies. Consider diversifying 
                        across more strategy types to reduce concentration risk.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-blue-400 font-medium">Greeks Management</h4>
                      <p className="text-gray-300 text-sm mt-1">
                        Current portfolio delta of 0.75 suggests high directional exposure. 
                        Consider delta-neutral strategies to reduce market risk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Recommended Actions</h3>
              <div className="space-y-4">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Rebalance Portfolio</h4>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">High Priority</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Reduce position sizes in Iron Condors and add protective puts to manage downside risk.
                  </p>
                  <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg text-sm hover:from-orange-700 hover:to-red-700 transition-all">
                    Implement Rebalancing
                  </button>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Hedge Gamma Risk</h4>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Medium Priority</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    High gamma exposure detected. Consider adding short gamma positions to neutralize risk.
                  </p>
                  <button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-2 px-4 rounded-lg text-sm hover:from-yellow-700 hover:to-orange-700 transition-all">
                    Add Hedge Positions
                  </button>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Volatility Strategy</h4>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Opportunity</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Current market volatility is below historical average. Good time for long volatility plays.
                  </p>
                  <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:from-green-700 hover:to-blue-700 transition-all">
                    Explore Strategies
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Export and Tools */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Analytics Tools</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="font-medium">Export Report</div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="font-medium">Backtest Strategy</div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="font-medium">Risk Scenario</div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div className="font-medium">Optimization</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}