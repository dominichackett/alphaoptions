'use client'
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext"; // Your combined auth context
import { useWeb3Auth } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

const OptionsHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isTradingDropdownOpen, setIsTradingDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Use combined auth context
  const { 
    isAuthenticated, 
    loading: authLoading, 
    error: authError, 
    web3AuthUser, 
    supabaseUser, 
    signOut,
    signInWithSupabase
  } = useAuth();
  
  // Use base Web3Auth hook for status only
  const { web3Auth, isConnected: web3AuthConnected, status } = useWeb3Auth();
  
  const { address } = useAccount();

  // Update current time every second for market status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if Web3Auth is ready
  const isWeb3AuthReady = status === 'ready' || (status === 'connected' && web3AuthUser);
  const isWeb3AuthConnected = status === 'connected' && web3AuthUser;
  const isBrokenConnection = status === 'connected' && !web3AuthUser;
  
  // Combine loading states
  const loading = authLoading;

  // Helper function to truncate address
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Helper function to copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Check if markets are open (simplified logic)
  const isMarketOpen = () => {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    
    // Crypto is always open (24/7)
    // US Markets: 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC), Mon-Fri
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 14 && hour < 21;
    
    return {
      crypto: true,
      stocks: isWeekday && isMarketHours,
      forex: day !== 0 && !(day === 6 && hour >= 22) // Forex closed Saturday 22:00 UTC to Sunday 22:00 UTC
    };
  };

  const marketStatus = isMarketOpen();

  const logout = async () => {
    if(web3Auth)
      await web3Auth.logout();
  }

  // Handle connect - trigger Web3Auth modal
  const handleConnect = async () => {
    if (!web3Auth) {
      console.error('Web3Auth instance not available');
      return;
    }

    try {
      // If Web3Auth shows connected but no user, clear the session first
      if (status === 'connected' && !web3AuthUser) {
        await web3Auth.logout();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Now connect fresh
      await web3Auth.connect();
      
    } catch (error) {
      console.error('Web3Auth connection failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10  bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">Ω</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">AlphaOptions</span>
              <span className="text-xs text-gray-400 hidden sm:block">24/7 Multi-Asset Options Trading</span>
            </div>
          </div>

          {/* Market Status Indicator */}
          <div className="hidden lg:flex items-center space-x-4 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${marketStatus.crypto ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-300">CRYPTO</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${marketStatus.stocks ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-300">STOCKS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${marketStatus.forex ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-300">FOREX</span>
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6a2 2 0 002 2h4a2 2 0 002-2V5" />
              </svg>
              <span>Dashboard</span>
            </a>
            
            {/* Trading Dropdown */}
            <div className="relative group">
              <button 
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1"
                onClick={() => setIsTradingDropdownOpen(!isTradingDropdownOpen)}
                onMouseEnter={() => setIsTradingDropdownOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Trade</span>
                <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     style={{ transform: isTradingDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Enhanced Trading Dropdown Menu */}
              {isTradingDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50"
                  onMouseLeave={() => setIsTradingDropdownOpen(false)}
                >
                  <div className="py-2">
                    {/* Asset Classes Section */}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Asset Classes
                    </div>
                    <a 
                      href="/trade/crypto" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Crypto Options</span>
                      <span className="text-xs text-green-400 ml-auto">24/7</span>
                    </a>
                    <a 
                      href="/trade/stocks" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Stock Options</span>
                      <span className="text-xs text-purple-400 ml-auto">24/7*</span>
                    </a>
                    <a 
                      href="/trade/forex" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Forex Options</span>
                      <span className="text-xs text-gray-400 ml-auto">24/5</span>
                    </a>
                    
                 
                    {/* NEW: Income Strategies Section */}
                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <div className="px-4 py-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center space-x-1">
                        <span>💰</span>
                        <span>Earn Income</span>
                        <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-normal">NEW</span>
                      </div>
                      <a 
                        href="/income/covered-calls" 
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <span>Sell Covered Calls</span>
                          <span className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">5-15% APY</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Generate income from holdings</div>
                      </a>
                      <a 
                        href="/income/cash-secured-puts" 
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <span>Cash-Secured Puts</span>
                          <span className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">8-20% APY</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Earn while waiting to buy</div>
                      </a>
                      <a 
                        href="/income/volatility-farming" 
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <span>Volatility Farming</span>
                          <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">12-35% APY</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Iron condors & straddles</div>
                      </a>
                      <a 
                        href="/income/opportunities" 
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <span>Premium Opportunities</span>
                          <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Live Feed</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">AI-suggested income trades</div>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="/portfolio" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Portfolio</span>
            </a>

            <a href="/analytics" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
              <span>Analytics</span>
            </a>
            
           
          </nav>

          {/* CTA Buttons - Sign In when not connected OR connection is broken */}
          {(!isAuthenticated && !isWeb3AuthConnected) || isBrokenConnection ? (
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleConnect}
                disabled={loading && !isBrokenConnection}
                className="cursor-pointer bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading && !isBrokenConnection ? 'Connecting...' : isBrokenConnection ? 'Reconnect Wallet' : !isWeb3AuthReady ? `Initializing... (${status})` : 'Connect Wallet'}
              </button>
            </div>
          ) : null}

          {/* Show processing state when Web3Auth is connected but Supabase isn't ready */}
          {!isAuthenticated && isWeb3AuthConnected && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up account...</span>
              </div>
            </div>
          )}

          {/* Address and Sign Out when connected */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              {/* User Info Display */}
              <div className="flex items-center space-x-3">
                {/* User Avatar/Name */}
                {(web3AuthUser?.profileImage || web3AuthUser?.name) && (
                  <div className="flex items-center space-x-2">
                    {web3AuthUser?.profileImage && (
                      <img 
                        src={web3AuthUser.profileImage} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                      />
                    )}
                    {web3AuthUser?.name && (
                      <span className="text-gray-300 text-sm font-medium">
                        {web3AuthUser.name}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Address Display */}
                <button 
                  onClick={copyAddress}
                  className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600 transition-all duration-200 cursor-pointer group"
                  title="Click to copy full address"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-mono group-hover:text-white transition-colors">
                    {address ? truncateAddress(address) : 'Connected'}
                  </span>
                  {/* Copy Icon */}
                  <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {copied ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>
              </div>
              
              {/* Sign Out Button */}
              <button 
                onClick={logout}
                disabled={loading}
                className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
              >
                {loading ? 'Signing Out...' : 'Disconnect'}
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Market Status */}
              <div className="flex items-center justify-between bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${marketStatus.crypto ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-300">CRYPTO</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${marketStatus.stocks ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-300">STOCKS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${marketStatus.forex ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-300">FOREX</span>
                  </div>
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

              <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span>Dashboard</span>
              </a>
              
              {/* Mobile Trading Section */}
              <div className="space-y-2">
                <span className="text-gray-400 text-sm font-medium flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Trading</span>
                </span>
                <div className="pl-6 space-y-2">
                  <a href="/trade/crypto" className="block text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between">
                    <span>Crypto Options</span>
                    <span className="text-xs text-green-400">24/7</span>
                  </a>
                  <a href="/trade/stocks" className="block text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between">
                    <span>Stock Options</span>
                    <span className="text-xs text-purple-400">24/7*</span>
                  </a>
                  <a href="/trade/forex" className="block text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between">
                    <span>Forex Options</span>
                    <span className="text-xs text-gray-400">24/5</span>
                  </a>
                  <a href="/strategies" className="block text-gray-300 hover:text-white transition-colors duration-200">
                    Strategy Builder
                  </a>
                  <a href="/templates" className="block text-gray-300 hover:text-white transition-colors duration-200">
                    Strategy Templates
                  </a>
                </div>
              </div>

              {/* Mobile Income Section */}
              <div className="space-y-2">
                <span className="text-yellow-400 text-sm font-medium flex items-center space-x-2">
                  <span>💰</span>
                  <span>Earn Income</span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-normal">NEW</span>
                </span>
                <div className="pl-6 space-y-2">
                  <a href="/income/covered-calls" className="block text-gray-300 hover:text-white transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <span>Sell Covered Calls</span>
                      <span className="text-xs text-green-400">5-15% APY</span>
                    </div>
                  </a>
                  <a href="/income/cash-secured-puts" className="block text-gray-300 hover:text-white transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <span>Cash-Secured Puts</span>
                      <span className="text-xs text-green-400">8-20% APY</span>
                    </div>
                  </a>
                  <a href="/income/volatility-farming" className="block text-gray-300 hover:text-white transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <span>Volatility Farming</span>
                      <span className="text-xs text-blue-400">12-35% APY</span>
                    </div>
                  </a>
                  <a href="/income/opportunities" className="block text-gray-300 hover:text-white transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <span>Premium Opportunities</span>
                      <span className="text-xs text-purple-400">Live</span>
                    </div>
                  </a>
                </div>
              </div>

              <a href="/portfolio" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Portfolio</span>
              </a>

              <a href="/analytics" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                <span>Analytics</span>
              </a>
              
              {/* Mobile Account Section - Only show when authenticated */}
              {isAuthenticated && (
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm font-medium flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Account</span>
                  </span>
                  <div className="pl-6 space-y-2">
                    <a href="/positions" className="block text-gray-300 hover:text-white transition-colors duration-200">
                      Open Positions
                    </a>
                    <a href="/orders" className="block text-gray-300 hover:text-white transition-colors duration-200">
                      Order History
                    </a>
                    <a href="/alerts" className="block text-gray-300 hover:text-white transition-colors duration-200">
                      Price Alerts
                    </a>
                    <a href="/profile" className="block text-gray-300 hover:text-white transition-colors duration-200">
                      Profile Settings
                    </a>
                    <a href="/preferences" className="block text-gray-300 hover:text-white transition-colors duration-200">
                      Trading Preferences
                    </a>
                    <a href="/security" className="block text-gray-300 hover:text-white transition-colors duration-200">
                      Security
                    </a>
                  </div>
                </div>
              )}
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-700">
                {(!isAuthenticated && !isWeb3AuthConnected) || isBrokenConnection ? (
                  <button 
                    onClick={handleConnect}
                    disabled={loading && !isBrokenConnection}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading && !isBrokenConnection ? 'Connecting...' : isBrokenConnection ? 'Reconnect Wallet' : !isWeb3AuthReady ? `Initializing... (${status})` : 'Connect Wallet'}
                  </button>
                ) : !isAuthenticated && isWeb3AuthConnected ? (
                  <div className="w-full flex items-center justify-center space-x-2 text-gray-300 py-3">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up account...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Mobile User Info */}
                    {web3AuthUser?.name && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-600">
                        {web3AuthUser?.profileImage && (
                          <img 
                            src={web3AuthUser.profileImage} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                          />
                        )}
                        <span className="text-gray-300 text-sm font-medium">
                          {web3AuthUser.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Mobile Address Display */}
                    <button 
                      onClick={copyAddress}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600 transition-all duration-200 cursor-pointer group"
                      title="Click to copy full address"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm font-mono group-hover:text-white transition-colors">
                        {address ? truncateAddress(address) : 'Connected'}
                      </span>
                      {/* Copy Icon */}
                      <svg 
                        className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        {copied ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        )}
                      </svg>
                    </button>
                    
                    {/* Mobile Sign Out Button */}
                    <button 
                      onClick={signOut}
                      disabled={loading}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                    >
                      {loading ? 'Signing Out...' : 'Disconnect Wallet'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(authError || (!isWeb3AuthReady && status)) && (
          <div className="absolute top-full left-0 right-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 text-sm">
            {authError || `Web3Auth Status: ${status}`}
          </div>
        )}

        {/* Success/Info Messages */}
        {copied && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 text-sm rounded-lg">
            Address copied to clipboard!
          </div>
        )}
      </div>
    </header>
  )
}

export default OptionsHeader;