'use client'
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import OptionsHeader from '../../components/Header/Header';

const CoveredCallsPage = () => {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const [selectedExpiry, setSelectedExpiry] = useState('2024-08-30');
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [chartTimeframe, setChartTimeframe] = useState('1D');

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
      earnings: '2024-08-21',
      synthetic24x7: true
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 180.10,
      change: -1.20,
      changePercent: -0.66,
      volume24h: '65.1M',
      volatility: 25.7,
      marketCap: '1.84T',
      sector: 'E-commerce',
      earnings: '2024-07-30',
      synthetic24x7: true
    },
    {
      symbol: 'GOOG',
      name: 'Alphabet Inc. (Class C)',
      price: 175.50,
      change: +5.60,
      changePercent: +3.30,
      volume24h: '28.9M',
      volatility: 30.5,
      marketCap: '2.18T',
      sector: 'Technology',
      earnings: '2024-07-24',
      synthetic24x7: true
    },
    {
      symbol: 'META',
      name: 'Meta Platforms Inc.',
      price: 495.20,
      change: +7.80,
      changePercent: +1.60,
      volume24h: '38.2M',
      volatility: 38.1,
      marketCap: '1.26T',
      sector: 'Social Media',
      earnings: '2024-07-24',
      synthetic24x7: true
    },
    {
      symbol: 'BRK.B',
      name: 'Berkshire Hathaway Inc. (Class B)',
      price: 410.30,
      change: -0.90,
      changePercent: -0.22,
      volume24h: '5.6M',
      volatility: 15.2,
      marketCap: '890.5B',
      sector: 'Conglomerate',
      earnings: '2024-08-03',
      synthetic24x7: true
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      price: 198.70,
      change: +1.50,
      changePercent: +0.76,
      volume24h: '18.1M',
      volatility: 20.3,
      marketCap: '575.1B',
      sector: 'Financial Services',
      earnings: '2024-07-12',
      synthetic24x7: true
    },
  ];

  // Mock options data for selected assets
  const optionsData = {
    'AAPL': [
      { type: 'call', strike: 180, bid: 6.20, ask: 6.30, last: 6.25, volume: 1200, openInterest: 15000, impliedVolatility: 0.25 },
      { type: 'call', strike: 185, bid: 3.50, ask: 3.60, last: 3.55, volume: 800, openInterest: 10000, impliedVolatility: 0.22 },
      { type: 'call', strike: 190, bid: 1.80, ask: 1.90, last: 1.85, volume: 500, openInterest: 7000, impliedVolatility: 0.20 },
      { type: 'put', strike: 180, bid: 1.50, ask: 1.60, last: 1.55, volume: 400, openInterest: 6000, impliedVolatility: 0.28 },
      { type: 'put', strike: 175, bid: 0.80, ask: 0.90, last: 0.85, volume: 300, openInterest: 4000, impliedVolatility: 0.30 },
    ],
    'TSLA': [
      { type: 'call', strike: 240, bid: 10.50, ask: 10.70, last: 10.60, volume: 2500, openInterest: 20000, impliedVolatility: 0.40 },
      { type: 'call', strike: 250, bid: 6.80, ask: 7.00, last: 6.90, volume: 1800, openInterest: 15000, impliedVolatility: 0.38 },
      { type: 'call', strike: 260, bid: 3.20, ask: 3.40, last: 3.30, volume: 1000, openInterest: 10000, impliedVolatility: 0.35 },
      { type: 'put', strike: 240, bid: 5.00, ask: 5.20, last: 5.10, volume: 700, openInterest: 8000, impliedVolatility: 0.45 },
      { type: 'put', strike: 230, bid: 2.50, ask: 2.70, last: 2.60, volume: 500, openInterest: 6000, impliedVolatility: 0.48 },
    ],
    'MSFT': [
      { type: 'call', strike: 420, bid: 8.00, ask: 8.20, last: 8.10, volume: 1500, openInterest: 18000, impliedVolatility: 0.20 },
      { type: 'call', strike: 425, bid: 4.50, ask: 4.70, last: 4.60, volume: 1000, openInterest: 12000, impliedVolatility: 0.18 },
      { type: 'call', strike: 430, bid: 2.00, ask: 2.20, last: 2.10, volume: 700, openInterest: 8000, impliedVolatility: 0.16 },
      { type: 'put', strike: 420, bid: 3.00, ask: 3.20, last: 3.10, volume: 600, openInterest: 7000, impliedVolatility: 0.22 },
      { type: 'put', strike: 415, bid: 1.50, ask: 1.70, last: 1.60, volume: 400, openInterest: 5000, impliedVolatility: 0.24 },
    ],
    'GOOGL': [
      { type: 'call', strike: 175, bid: 5.00, ask: 5.20, last: 5.10, volume: 1000, openInterest: 10000, impliedVolatility: 0.30 },
      { type: 'call', strike: 180, bid: 2.80, ask: 3.00, last: 2.90, volume: 700, openInterest: 7000, impliedVolatility: 0.28 },
      { type: 'call', strike: 185, bid: 1.20, ask: 1.40, last: 1.30, volume: 400, openInterest: 4000, impliedVolatility: 0.25 },
      { type: 'put', strike: 175, bid: 2.00, ask: 2.20, last: 2.10, volume: 300, openInterest: 3000, impliedVolatility: 0.32 },
      { type: 'put', strike: 170, bid: 0.90, ask: 1.10, last: 1.00, volume: 200, openInterest: 2000, impliedVolatility: 0.35 },
    ],
    'NVDA': [
      { type: 'call', strike: 115, bid: 15.00, ask: 15.50, last: 15.25, volume: 3000, openInterest: 25000, impliedVolatility: 0.50 },
      { type: 'call', strike: 120, bid: 10.00, ask: 10.50, last: 10.25, volume: 2000, openInterest: 18000, impliedVolatility: 0.48 },
      { type: 'call', strike: 125, bid: 6.00, ask: 6.50, last: 6.25, volume: 1500, openInterest: 12000, impliedVolatility: 0.45 },
      { type: 'put', strike: 115, bid: 8.00, ask: 8.50, last: 8.25, volume: 1000, openInterest: 10000, impliedVolatility: 0.55 },
      { type: 'put', strike: 110, bid: 4.00, ask: 4.50, last: 4.25, volume: 800, openInterest: 7000, impliedVolatility: 0.58 },
    ],
    'AMZN': [
      { type: 'call', strike: 175, bid: 7.00, ask: 7.20, last: 7.10, volume: 1200, openInterest: 14000, impliedVolatility: 0.28 },
      { type: 'call', strike: 180, bid: 4.00, ask: 4.20, last: 4.10, volume: 900, openInterest: 10000, impliedVolatility: 0.26 },
      { type: 'call', strike: 185, bid: 1.80, ask: 2.00, last: 1.90, volume: 600, openInterest: 6000, impliedVolatility: 0.24 },
      { type: 'put', strike: 175, bid: 2.50, ask: 2.70, last: 2.60, volume: 500, openInterest: 5000, impliedVolatility: 0.30 },
      { type: 'put', strike: 170, bid: 1.00, ask: 1.20, last: 1.10, volume: 300, openInterest: 3000, impliedVolatility: 0.32 },
    ],
    'GOOG': [
      { type: 'call', strike: 170, bid: 6.00, ask: 6.20, last: 6.10, volume: 900, openInterest: 9000, impliedVolatility: 0.29 },
      { type: 'call', strike: 175, bid: 3.50, ask: 3.70, last: 3.60, volume: 600, openInterest: 6000, impliedVolatility: 0.27 },
      { type: 'call', strike: 180, bid: 1.50, ask: 1.70, last: 1.60, volume: 300, openInterest: 3000, impliedVolatility: 0.24 },
      { type: 'put', strike: 170, bid: 2.20, ask: 2.40, last: 2.30, volume: 200, openInterest: 2500, impliedVolatility: 0.31 },
      { type: 'put', strike: 165, bid: 0.80, ask: 1.00, last: 0.90, volume: 150, openInterest: 1500, impliedVolatility: 0.34 },
    ],
    'META': [
      { type: 'call', strike: 490, bid: 9.00, ask: 9.30, last: 9.15, volume: 1800, openInterest: 16000, impliedVolatility: 0.35 },
      { type: 'call', strike: 495, bid: 5.50, ask: 5.80, last: 5.65, volume: 1200, openInterest: 11000, impliedVolatility: 0.33 },
      { type: 'call', strike: 500, bid: 2.80, ask: 3.10, last: 2.95, volume: 800, openInterest: 7000, impliedVolatility: 0.30 },
      { type: 'put', strike: 490, bid: 4.00, ask: 4.30, last: 4.15, volume: 700, openInterest: 6000, impliedVolatility: 0.38 },
      { type: 'put', strike: 485, bid: 1.80, ask: 2.10, last: 1.95, volume: 500, openInterest: 4000, impliedVolatility: 0.40 },
    ],
    'BRK.B': [
      { type: 'call', strike: 400, bid: 4.00, ask: 4.20, last: 4.10, volume: 500, openInterest: 5000, impliedVolatility: 0.15 },
      { type: 'call', strike: 410, bid: 1.50, ask: 1.70, last: 1.60, volume: 300, openInterest: 3000, impliedVolatility: 0.13 },
      { type: 'call', strike: 420, bid: 0.50, ask: 0.60, last: 0.55, volume: 100, openInterest: 1000, impliedVolatility: 0.12 },
      { type: 'put', strike: 400, bid: 1.00, ask: 1.20, last: 1.10, volume: 200, openInterest: 2000, impliedVolatility: 0.17 },
      { type: 'put', strike: 390, bid: 0.30, ask: 0.40, last: 0.35, volume: 50, openInterest: 500, impliedVolatility: 0.19 },
    ],
    'JPM': [
      { type: 'call', strike: 195, bid: 3.00, ask: 3.20, last: 3.10, volume: 800, openInterest: 8000, impliedVolatility: 0.18 },
      { type: 'call', strike: 200, bid: 1.20, ask: 1.40, last: 1.30, volume: 500, openInterest: 5000, impliedVolatility: 0.16 },
      { type: 'call', strike: 205, bid: 0.40, ask: 0.50, last: 0.45, volume: 200, openInterest: 2000, impliedVolatility: 0.15 },
      { type: 'put', strike: 195, bid: 0.80, ask: 1.00, last: 0.90, volume: 300, openInterest: 3000, impliedVolatility: 0.20 },
      { type: 'put', strike: 190, bid: 0.20, ask: 0.30, last: 0.25, volume: 100, openInterest: 1000, impliedVolatility: 0.22 },
    ],
  };

  // Mock historical data for charts
  const historicalData = {
    '1D': [
      { name: '9:30', price: 185.00 }, { name: '10:00', price: 185.20 }, { name: '10:30', price: 185.50 },
      { name: '11:00', price: 185.30 }, { name: '11:30', price: 185.60 }, { name: '12:00', price: 185.40 },
      { name: '12:30', price: 185.70 }, { name: '13:00', price: 185.90 }, { name: '13:30', price: 185.80 },
      { name: '14:00', price: 186.00 }, { name: '14:30', price: 185.70 }, { name: '15:00', price: 185.90 },
      { name: '15:30', price: 185.75 }, { name: '16:00', price: 185.75 },
    ],
    '1W': [
      { name: 'Mon', price: 180.00 }, { name: 'Tue', price: 182.50 }, { name: 'Wed', price: 185.00 },
      { name: 'Thu', price: 184.00 }, { name: 'Fri', price: 185.75 },
    ],
    '1M': [
      { name: 'Week 1', price: 170.00 }, { name: 'Week 2', price: 175.00 }, { name: 'Week 3', price: 180.00 },
      { name: 'Week 4', price: 185.75 },
    ],
    '1Y': [
      { name: 'Jan', price: 150.00 }, { name: 'Feb', price: 155.00 }, { name: 'Mar', price: 160.00 },
      { name: 'Apr', price: 165.00 }, { name: 'May', price: 170.00 }, { name: 'Jun', price: 175.00 },
      { name: 'Jul', price: 185.75 },
    ],
  };

  const currentAsset = stockAssets.find(asset => asset.symbol === selectedAsset);
  const availableOptions = optionsData[selectedAsset]?.filter(option => option.type === 'call') || [];

  const calculateProfitLoss = () => {
    if (!selectedOption || !currentAsset) return 0;
    const premiumReceived = selectedOption.last * 100 * quantity; // Assuming 100 shares per contract
    const currentStockValue = currentAsset.price * 100 * quantity;
    const strikeValue = selectedOption.strike * 100 * quantity;

    if (currentAsset.price > selectedOption.strike) {
      // In-the-money: option exercised, stock sold at strike price
      return premiumReceived + (strikeValue - currentStockValue);
    } else {
      // Out-of-the-money: option expires worthless, keep premium
      return premiumReceived;
    }
  };

  const profitLoss = calculateProfitLoss();

  const handleTrade = () => {
    if (!selectedOption || !currentAsset) {
      alert('Please select an asset and an option to trade.');
      return;
    }
    alert(`Trading ${quantity} contract(s) of ${selectedAsset} ${selectedOption.strike} Call (Expiry: ${selectedExpiry})`);
    // Here you would integrate with a real trading API
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <OptionsHeader />
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Covered Calls</h1>

        {/* Asset Selection and Overview */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">Select Asset</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockAssets.map(asset => (
              <div
                key={asset.symbol}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${selectedAsset === asset.symbol ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 hover:border-blue-600'}`}
                onClick={() => setSelectedAsset(asset.symbol)}
              >
                <h3 className="text-xl font-bold mb-1">{asset.symbol} - {asset.name}</h3>
                <p className="text-3xl font-extrabold mb-2">${asset.price.toFixed(2)}</p>
                <p className={`text-lg font-semibold ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
                </p>
                <div className="text-sm text-gray-400 mt-2">
                  <p>24h Volume: {asset.volume24h}</p>
                  <p>Market Cap: {asset.marketCap}</p>
                  <p>Volatility: {asset.volatility}%</p>
                  <p>Sector: {asset.sector}</p>
                  <p>Next Earnings: {asset.earnings}</p>
                  {asset.synthetic24x7 && <p className="text-purple-400">24/7 Synthetic Pricing</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Option Chain and Selection */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">Option Chain for {selectedAsset} (Calls)</h2>
          <div className="mb-4">
            <label htmlFor="expiry-select" className="block text-gray-300 text-sm font-bold mb-2">Select Expiry:</label>
            <select
              id="expiry-select"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
            >
              {/* Mock expiries - in a real app, these would be dynamic */}
              <option value="2024-08-30">August 30, 2024</option>
              <option value="2024-09-20">September 20, 2024</option>
              <option value="2024-10-18">October 18, 2024</option>
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
                  <th className="py-3 px-6 text-left">Volume</th>
                  <th className="py-3 px-6 text-left">Open Interest</th>
                  <th className="py-3 px-6 text-left">Implied Volatility</th>
                  <th className="py-3 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 text-sm font-light">
                {availableOptions.length > 0 ? (
                  availableOptions.map((option, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-600 hover:bg-gray-600 ${selectedOption === option ? 'bg-blue-900/50' : ''}`}
                      onClick={() => setSelectedOption(option)}
                    >
                      <td className="py-3 px-6 text-left whitespace-nowrap">${option.strike.toFixed(2)}</td>
                      <td className="py-3 px-6 text-left">${option.bid.toFixed(2)}</td>
                      <td className="py-3 px-6 text-left">${option.ask.toFixed(2)}</td>
                      <td className="py-3 px-6 text-left">${option.last.toFixed(2)}</td>
                      <td className="py-3 px-6 text-left">{option.volume}</td>
                      <td className="py-3 px-6 text-left">{option.openInterest}</td>
                      <td className="py-3 px-6 text-left">{(option.impliedVolatility * 100).toFixed(2)}%</td>
                      <td className="py-3 px-6 text-center">
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                          onClick={() => setSelectedOption(option)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-4 text-center text-gray-400">No call options available for this asset.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected Option Details and Trade Panel */}
        {selectedOption && currentAsset && (
          <section className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-300">Selected Option & Trade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xl font-bold mb-2">{selectedAsset} Call Option</p>
                <p>Strike: <span className="font-semibold">${selectedOption.strike.toFixed(2)}</span></p>
                <p>Last Price: <span className="font-semibold">${selectedOption.last.toFixed(2)}</span></p>
                <p>Expiry: <span className="font-semibold">{selectedExpiry}</span></p>
                <p>Premium per share: <span className="font-semibold">${selectedOption.last.toFixed(2)}</span></p>
                <p>Total Premium (1 contract): <span className="font-semibold">${(selectedOption.last * 100).toFixed(2)}</span></p>
                <p className="mt-4 text-lg font-bold text-green-400">
                  Potential Profit/Loss at Expiry: ${profitLoss.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  (Assumes holding 100 shares per contract. Profit/Loss is premium received minus intrinsic value if ITM, or just premium if OTM.)
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Place Trade</h3>
                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-gray-300 text-sm font-bold mb-2">Quantity (Contracts):</label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                  />
                </div>
                <button
                  onClick={handleTrade}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors duration-200"
                >
                  Sell {quantity} Covered Call(s)
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Price Chart */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">Price Chart for {selectedAsset}</h2>
          <div className="mb-4">
            {['1D', '1W', '1M', '1Y'].map(tf => (
              <button
                key={tf}
                className={`mr-2 py-2 px-4 rounded-lg ${chartTimeframe === tf ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                onClick={() => setChartTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={historicalData[chartTimeframe]}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis stroke="#8884d8" domain={['dataMin - 5', 'dataMax + 5']} />
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <Tooltip
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '5px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#8884d8' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </main>
    </div>
  );
};

export default CoveredCallsPage;
