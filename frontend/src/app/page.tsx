'use client'
import React from 'react';
import Header from '@/components/Header/Header';
const logos = [
  { id: 1, src: '/logo/lit.jfif', alt: 'Logo 1' },
  { id: 2, src: '/logo/vincent.png', alt: 'Logo 2' },
  { id: 3, src: '/logo/agentwallet.jfif', alt: 'Logo 3' },
  { id: 4, src: '/logo/filecoin.png', alt: 'Logo 4' },
];
const LitProtocolStyles = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Header Navigation */}
     <Header/>
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
              <span className="block">AI Technical Analyst/Trading Signals</span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                 Stocks, Crypto and Forex
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
             Alpha Signals is the decentralized AI-powered platform for reading charts and generating trading signals across crypto, stocks, and forex.
Join the traders and builders leveraging intelligent analysis and a marketplace of signals to stay ahead of the markets.
            </p>
          </div>
        </div>
        
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-purple-900/20 to-transparent pointer-events-none z-5"></div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            AI Powered Trading Singals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                $154M+
              </div>
              <div className="text-gray-400 text-lg">Trading Volume</div>
            </div>
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                1.4M+
              </div>
              <div className="text-gray-400 text-lg">Total Wallets Managed</div>
            </div>
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                120K
              </div>
              <div className="text-gray-400 text-lg">Singals Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Agent Wallets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-4xl font-bold">Agent Wallets</h3>
              <p className="text-xl text-purple-300">
                Universal Accounts For User Controlled Automation
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
               Let our agents trade your signals.
               User defined agent trading.
              </p>
              <ul className="space-y-3 text-gray-300">
              
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>User authorization</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>On-chain, Trading</span>
                </li>
              </ul>
            
            </div>
            <div className="relative">
<div 
  className="w-full h-96 rounded-2xl border border-purple-500/20 bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: 'url(/wallet.png)' }}
>

</div>            </div>
          </div>

          {/* Interoperability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
           <div 
  className="w-full h-256 rounded-2xl border border-blue-500/20 bg-cover bg-center bg-no-repeat relative"
  style={{ backgroundImage: 'url(/trading.png)' }}
>
  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl"></div>
</div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h3 className="text-4xl font-bold">AI Trading Signals</h3>
              <p className="text-xl text-blue-300">
                AI Technical Analysis 
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Trend or Momentum Trading analysis perfomred by artificial intelligence 
                . Trading signal generation.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>AI generated trading signals</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>List your signals</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Trade your signals</span>
                </li>
              </ul>
              
            </div>
          </div>

        </div>
      </section>

      {/* Network Features */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <h2 className="text-4xl md:text-5xl font-bold">Alpha Signals Feature</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 rounded-xl bg-gray-900/50 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-purple-300">Trading View Charts</h3>
              <p className="text-gray-300 leading-relaxed">
                Integrates TradingView Charts to provide advanced, real-time market data visualization with interactive technical analysis tools.
              </p>
            </div>
            
            <div className="space-y-4 p-6 rounded-xl bg-gray-900/50 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-blue-300">AI Trading Signals</h3>
              <p className="text-gray-300 leading-relaxed">
                Leverages AI-powered trading signals to analyze market trends and deliver real-time, data-driven trade recommendations with high accuracy.
              </p>
            </div>
            
            <div className="space-y-4 p-6 rounded-xl bg-gray-900/50 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-green-300">Automated Trading</h3>
              <p className="text-gray-300 leading-relaxed">
                Enables automated trading by executing predefined strategies in real-time, reducing human error and ensuring fast, consistent trade execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Integration Section */}
      
    </div>
  );
};

export default LitProtocolStyles;