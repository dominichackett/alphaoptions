'use client'
import React from 'react';
import OptionsHeader  from './components/Header/Header';
const OptionsDAppMain = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      {/* Header Navigation */}
      <OptionsHeader />
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">Ω</span>
              </div>
              <span className="text-2xl font-bold">AlphaOptions</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#strategies" className="text-gray-300 hover:text-white transition-colors">Strategies</a>
              <a href="#analytics" className="text-gray-300 hover:text-white transition-colors">Analytics</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                Launch App
              </button>
            </nav>
          </div>
        </div>

      {/* Hero Section with Background Image */}
      <section 
        className="relative px-6 py-20 pt-32 overflow-hidden"
        style={{
          backgroundImage: 'url(/chart.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/75"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="block">24/7 Multi-Asset</span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                Options Trading
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              The world's most advanced DeFi options platform. Trade crypto, forex, and stock options 24/7 
              with professional-grade analytics, automated risk management, and gas-optimized execution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105">
                Start Trading
              </button>
              <button className="border border-gray-400 px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/10 transition-all">
                View Strategies
              </button>
            </div>
          </div>
        </div>
        
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none z-5"></div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Revolutionary DeFi Options Trading
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-gray-400 text-lg">Always-On Trading</div>
              <div className="text-sm text-gray-500">Including weekends & holidays</div>
            </div>
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                3
              </div>
              <div className="text-gray-400 text-lg">Asset Classes</div>
              <div className="text-sm text-gray-500">Crypto, Forex & Stocks</div>
            </div>
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                -75%
              </div>
              <div className="text-gray-400 text-lg">Gas Savings</div>
              <div className="text-sm text-gray-500">vs traditional options DEXs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-20 px-6" id="features">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Multi-Asset Trading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-400 uppercase tracking-wide">Multi-Asset Support</span>
              </div>
              <h3 className="text-4xl font-bold">Trade Any Asset, Anytime</h3>
              <p className="text-xl text-blue-300">
                The only platform offering options on crypto, forex, and stocks in one interface
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Experience unprecedented flexibility with 24/7 crypto trading, traditional forex pairs, 
                and synthetic stock exposure. No market hours, no geographical restrictions.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">₿</div>
                  <div className="text-sm font-medium">Crypto</div>
                  <div className="text-xs text-gray-400">ETH, BTC, LINK</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">💱</div>
                  <div className="text-sm font-medium">Forex</div>
                  <div className="text-xs text-gray-400">EUR/USD, GBP/USD</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-sm font-medium">Stocks</div>
                  <div className="text-xs text-gray-400">AAPL, TSLA, MSFT</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div 
                className="w-full h-96 rounded-2xl border border-blue-500/20 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/chart.jpg)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl"></div>
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-green-400 text-sm font-mono">AAPL $180 Call</div>
                  <div className="text-white text-xs">Expires: 30 Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/20 p-6 h-96">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold">Portfolio Analytics</h4>
                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">+12.5%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Delta</div>
                      <div className="text-xl font-bold text-blue-400">0.72</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Gamma</div>
                      <div className="text-xl font-bold text-purple-400">0.15</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Theta</div>
                      <div className="text-xl font-bold text-red-400">-0.05</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Vega</div>
                      <div className="text-xl font-bold text-green-400">0.28</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Portfolio Value</span>
                      <span className="text-white">$45,280</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Today's P&L</span>
                      <span className="text-green-400">+$1,250</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Open Positions</span>
                      <span className="text-white">12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-400 uppercase tracking-wide">Professional Analytics</span>
              </div>
              <h3 className="text-4xl font-bold">Institutional-Grade Risk Management</h3>
              <p className="text-xl text-purple-300">
                Real-time Greeks, P&L tracking, and automated risk controls
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Monitor your portfolio with professional-grade analytics. Real-time Greeks calculation, 
                position tracking, and automated liquidation protect your capital.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Real-time Greeks calculation (Δ, Γ, Θ, Ν)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Automated risk monitoring & liquidation</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Portfolio correlation analysis</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Gas Optimization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-400 uppercase tracking-wide">Gas Optimized</span>
              </div>
              <h3 className="text-4xl font-bold">75% Lower Gas Costs</h3>
              <p className="text-xl text-green-300">
                Built on 1inch Protocol for maximum efficiency
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our integration with 1inch's battle-tested infrastructure delivers unprecedented gas savings 
                while maintaining the highest security standards.
              </p>
              <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-6 border border-green-500/20">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-green-400">~180K</div>
                    <div className="text-sm text-gray-400">Gas per option creation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">~120K</div>
                    <div className="text-sm text-gray-400">Gas per exercise</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-green-500/20 p-6 h-96">
                <div className="space-y-6">
                  <h4 className="text-lg font-bold">Execution Comparison</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Traditional DEX</span>
                        <span className="text-red-400">~720K gas</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full w-full"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AlphaOptions (1inch)</span>
                        <span className="text-green-400">~180K gas</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-1/4"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-green-400 font-bold text-lg">75% Savings</div>
                    <div className="text-sm text-gray-300">Typical transaction cost reduction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Strategies Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-gray-900/50" id="strategies">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Advanced Trading Strategies</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From simple directional bets to complex multi-leg strategies, we support every options trading approach
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/20">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">📈</div>
              <h3 className="text-xl font-bold text-blue-300">Directional</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Long calls, puts, and spreads for bullish or bearish market views
              </p>
              <div className="text-xs text-blue-400">Bull spreads, Bear spreads</div>
            </div>
            
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/20">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl">🎪</div>
              <h3 className="text-xl font-bold text-purple-300">Volatility</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Straddles, strangles, and butterflies to profit from volatility changes
              </p>
              <div className="text-xs text-purple-400">Straddles, Iron Condors</div>
            </div>
            
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/20">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">💰</div>
              <h3 className="text-xl font-bold text-green-300">Income</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Cash-secured puts and credit spreads for consistent premium collection
              </p>
              <div className="text-xs text-green-400">Cash-secured puts, Credit spreads</div>
            </div>
            
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/20">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center text-2xl">🛡️</div>
              <h3 className="text-xl font-bold text-orange-300">Hedging</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Protective puts and collars to manage portfolio risk
              </p>
              <div className="text-xs text-orange-400">Protective puts, Collars</div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20 px-6" id="analytics">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Why Choose AlphaOptions?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The first and only platform to break the 150-year-old constraint of market hours
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-2xl border border-gray-700/50">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  🌍
                </div>
                <h3 className="text-2xl font-bold">Global 24/7 Access</h3>
                <p className="text-gray-300 leading-relaxed">
                  Trade stock options at 3 AM on Sunday. React to breaking news instantly. 
                  No geographical restrictions or market hour limitations.
                </p>
                <div className="text-sm text-blue-400 font-medium">
                  5.6x more trading opportunities than traditional platforms
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-2xl border border-gray-700/50">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <h3 className="text-2xl font-bold">Instant News Reaction</h3>
                <p className="text-gray-300 leading-relaxed">
                  While traditional brokers wait for market open, you're already positioned. 
                  Capture earnings moves, FDA approvals, and breaking news immediately.
                </p>
                <div className="text-sm text-green-400 font-medium">
                  Zero delay advantage over traditional options
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-2xl border border-gray-700/50">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                  🚀
                </div>
                <h3 className="text-2xl font-bold">DeFi Innovation</h3>
                <p className="text-gray-300 leading-relaxed">
                  Permissionless access, transparent pricing, and automated execution. 
                  No KYC requirements, no geographic restrictions.
                </p>
                <div className="text-sm text-purple-400 font-medium">
                  True decentralized options trading
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Trade the Future?
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            Join the revolution in options trading. Experience 24/7 multi-asset options 
            with professional-grade analytics and DeFi efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl">
              Launch Platform
            </button>
            <button className="border border-gray-400 px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/10 transition-all">
              Read Documentation
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Start with testnet • No KYC required • Audit in progress
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">Ω</span>
                </div>
                <span className="text-xl font-bold">AlphaOptions</span>
              </div>
              <p className="text-gray-400 text-sm">
                The world's first 24/7 multi-asset options trading platform
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Platform</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Trading Interface</div>
                <div>Analytics Dashboard</div>
                <div>Risk Management</div>
                <div>Strategy Builder</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Assets</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Crypto Options</div>
                <div>Forex Options</div>
                <div>Stock Options</div>
                <div>Synthetic Assets</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Resources</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Documentation</div>
                <div>API Reference</div>
                <div>Security Audits</div>
                <div>Community</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} AlphaOptions Protocol. Built on Ethereum with 1inch Protocol.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OptionsDAppMain;