'use client'
import React, { useState ,useEffect} from 'react';
import OptionsHeader from '../components/Header/Header';

const WriteOptionsPage = () => {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const [optionType, setOptionType] = useState('call');
  const [strikePrice, setStrikePrice] = useState(180);
  const [expiryDate, setExpiryDate] = useState('2024-08-30');
  const [quantity, setQuantity] = useState(1);
  const [collateralToken, setCollateralToken] = useState('USDC');
  const [collateralAmount, setCollateralAmount] = useState(0);

  // Mock data for assets and collateral tokens
  const assets = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.75, type: 'stock' },
    { symbol: 'ETH', name: 'Ethereum', price: 3245.67, type: 'crypto' },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0875, type: 'forex' },
  ];

  const collateralTokens = [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  ];

  const currentAsset = assets.find(asset => asset.symbol === selectedAsset);

  // Simulate collateral calculation (simplified)
  const calculateRequiredCollateral = () => {
    if (!currentAsset) return 0;
    let required = 0;
    if (optionType === 'call') {
      // For calls, collateral might be the value of the underlying asset
      required = currentAsset.price * quantity * 100; // Assuming 100 units per contract for stocks
      if (currentAsset.type === 'crypto') required = currentAsset.price * quantity; // 1:1 for crypto
      if (currentAsset.type === 'forex') required = currentAsset.price * quantity * 100000; // Notional for forex
    } else {
      // For puts, collateral might be the strike price * quantity
      required = strikePrice * quantity * 100; // Assuming 100 units per contract for stocks
      if (currentAsset.type === 'crypto') required = strikePrice * quantity; // 1:1 for crypto
      if (currentAsset.type === 'forex') required = strikePrice * quantity * 100000; // Notional for forex
    }
    return required;
  };

  useEffect(() => {
    setCollateralAmount(calculateRequiredCollateral());
  }, [selectedAsset, optionType, strikePrice, quantity]);

  const handleWriteOption = () => {
    if (!currentAsset || !selectedAsset || !optionType || !strikePrice || !expiryDate || !quantity || !collateralToken || collateralAmount <= 0) {
      alert('Please fill all fields and ensure collateral is positive.');
      return;
    }
    alert(`Writing ${quantity} ${selectedAsset} ${strikePrice} ${optionType.toUpperCase()} option, expiring ${expiryDate}, with ${collateralAmount.toFixed(2)} ${collateralToken} as collateral.`);
    // In a real application, this would interact with the OptionsProtocol.sol and CollateralVault.sol
    // to create the option order and lock the collateral.
    console.log({
      selectedAsset,
      optionType,
      strikePrice,
      expiryDate,
      quantity,
      collateralToken,
      collateralAmount,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <OptionsHeader />
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-400">Write New Options</h1>

        <section className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-green-300">Option Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="asset-select" className="block text-gray-300 text-sm font-bold mb-2">Underlying Asset:</label>
              <select
                id="asset-select"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
              >
                {assets.map(asset => (
                  <option key={asset.symbol} value={asset.symbol} className="text-white bg-gray-700">{asset.name} ({asset.symbol})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="option-type" className="block text-gray-300 text-sm font-bold mb-2">Option Type:</label>
              <select
                id="option-type"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={optionType}
                onChange={(e) => setOptionType(e.target.value)}
              >
                <option value="call" className="text-white bg-gray-700">Call</option>
                <option value="put" className="text-white bg-gray-700">Put</option>
              </select>
            </div>

            <div>
              <label htmlFor="strike-price" className="block text-gray-300 text-sm font-bold mb-2">Strike Price:</label>
              <input
                type="number"
                id="strike-price"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={strikePrice}
                onChange={(e) => setStrikePrice(parseFloat(e.target.value))}
                step="any"
              />
            </div>

            <div>
              <label htmlFor="expiry-date" className="block text-gray-300 text-sm font-bold mb-2">Expiry Date:</label>
              <input
                type="date"
                id="expiry-date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-gray-300 text-sm font-bold mb-2">Quantity (Contracts):</label>
              <input
                type="number"
                id="quantity"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-green-300">Collateral Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="collateral-token" className="block text-gray-300 text-sm font-bold mb-2">Collateral Token:</label>
              <select
                id="collateral-token"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={collateralToken}
                onChange={(e) => setCollateralToken(e.target.value)}
              >
                {collateralTokens.map(token => (
                  <option key={token.symbol} value={token.symbol} className="text-white bg-gray-700">{token.name} ({token.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="required-collateral" className="block text-gray-300 text-sm font-bold mb-2">Required Collateral (Estimated):</label>
              <input
                type="text"
                id="required-collateral"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 cursor-not-allowed"
                value={collateralAmount.toFixed(2)}
                readOnly
              />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Note: Required collateral is an estimate. Actual amount will be determined by the protocol's risk parameters.
          </p>
        </section>

        <div className="text-center">
          <button
            onClick={handleWriteOption}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 text-xl"
          >
            Write Option
          </button>
        </div>
      </main>
    </div>
  );
};

export default WriteOptionsPage;