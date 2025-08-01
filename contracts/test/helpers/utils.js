// test/helpers/utils.js
const { ethers } = require("hardhat");

// Time manipulation helpers
async function increaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

async function setNextBlockTimestamp(timestamp) {
  await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await network.provider.send("evm_mine");
}

async function getCurrentBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

// Option creation helpers
function createOptionSpec(params) {
  return {
    assetType: params.assetType || 0, // CRYPTO
    underlying: params.underlying || "ETH",
    optionType: params.optionType || 0, // CALL
    style: params.style || 0, // EUROPEAN
    strikePrice: params.strikePrice || ethers.parseEther("3000"),
    expiryTime: params.expiryTime || Math.floor(Date.now() / 1000) + 86400 * 7, // 1 week
    contractSize: params.contractSize || ethers.parseEther("1"),
    oracle: params.oracle
  };
}

function createOptionOrder(params) {
  return {
    maker: params.maker,
    taker: params.taker || ethers.ZeroAddress,
    makerAsset: params.makerAsset, // Collateral token
    takerAsset: params.takerAsset, // Premium token
    makerAmount: params.makerAmount, // Collateral amount
    takerAmount: params.takerAmount, // Premium amount
    salt: params.salt || Math.floor(Math.random() * 1000000),
    expiration: params.expiration || Math.floor(Date.now() / 1000) + 3600, // 1 hour
    predicate: params.predicate || "0x",
    makerAssetData: params.makerAssetData,
    takerAssetData: params.takerAssetData || "0x",
    interaction: params.interaction || "0x"
  };
}

// EIP-712 signature helpers
async function signOptionOrder(order, signer, verifyingContract) {
  const domain = {
    name: "DefiOptionsProtocol",
    version: "1.0",
    chainId: await signer.getChainId(),
    verifyingContract: verifyingContract
  };

  const types = {
    OptionOrder: [
      { name: "maker", type: "address" },
      { name: "taker", type: "address" },
      { name: "makerAsset", type: "address" },
      { name: "takerAsset", type: "address" },
      { name: "makerAmount", type: "uint256" },
      { name: "takerAmount", type: "uint256" },
      { name: "salt", type: "uint256" },
      { name: "expiration", type: "uint256" },
      { name: "predicate", type: "bytes" },
      { name: "makerAssetData", type: "bytes" },
      { name: "takerAssetData", type: "bytes" },
      { name: "interaction", type: "bytes" }
    ]
  };

  return await signer.signTypedData(domain, types, order);
}

// Price helpers
async function getCurrentPrice(oracle) {
  const [, price, , updatedAt,] = await oracle.latestRoundData();
  return {
    price: price,
    updatedAt: updatedAt,
    normalizedPrice: ethers.parseUnits(price.toString(), 10) // Convert to 18 decimals
  };
}

// Market hours helpers
function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function isAfterHours() {
  const now = new Date();
  const hour = now.getUTCHours();
  // US market hours: 14:30-21:00 UTC (9:30 AM - 4:00 PM EST)
  return hour < 14 || hour >= 21;
}

function getNextMarketOpen() {
  const now = new Date();
  let nextOpen = new Date(now);
  
  // If weekend, go to Monday
  if (now.getDay() === 0) { // Sunday
    nextOpen.setDate(now.getDate() + 1);
  } else if (now.getDay() === 6) { // Saturday
    nextOpen.setDate(now.getDate() + 2);
  }
  
  // Set to 9:30 AM EST (14:30 UTC)
  nextOpen.setUTCHours(14, 30, 0, 0);
  
  return Math.floor(nextOpen.getTime() / 1000);
}

// Calculation helpers
function calculateIntrinsicValue(optionType, currentPrice, strikePrice, contractSize) {
  let intrinsic = 0;
  
  if (optionType === 0) { // CALL
    if (currentPrice > strikePrice) {
      intrinsic = currentPrice - strikePrice;
    }
  } else { // PUT
    if (strikePrice > currentPrice) {
      intrinsic = strikePrice - currentPrice;
    }
  }
  
  return (intrinsic * contractSize) / ethers.parseEther("1");
}

function calculateRequiredCollateral(optionSpec, collateralRatio = 150) {
  if (optionSpec.optionType === 0) { // CALL
    // For calls: collateral = underlying amount
    return optionSpec.contractSize;
  } else { // PUT
    // For puts: collateral = strike * size * ratio
    return (optionSpec.strikePrice * optionSpec.contractSize * collateralRatio) / (100 * ethers.parseEther("1"));
  }
}

// Gas tracking helpers
async function trackGasUsage(txPromise, description) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(`⛽ Gas used for ${description}: ${receipt.gasUsed.toString()}`);
  return { tx, receipt, gasUsed: receipt.gasUsed };
}

// Expectation helpers  
function expectBigNumberEqual(actual, expected, tolerance = 0) {
  if (tolerance === 0) {
    expect(actual).to.equal(expected);
  } else {
    const diff = actual > expected ? actual - expected : expected - actual;
    const maxDiff = (expected * BigInt(tolerance)) / BigInt(10000); // tolerance in basis points
    expect(diff).to.be.lte(maxDiff);
  }
}

function expectBigNumberCloseTo(actual, expected, toleranceBps) {
  const diff = actual > expected ? actual - expected : expected - actual;
  const maxDiff = (expected * BigInt(toleranceBps)) / BigInt(10000);
  expect(diff).to.be.lte(maxDiff);
}

// Error helpers
async function expectRevert(promise, expectedError) {
  try {
    await promise;
    expect.fail("Expected transaction to revert");
  } catch (error) {
    if (expectedError) {
      expect(error.message).to.include(expectedError);
    }
  }
}

module.exports = {
  increaseTime,
  setNextBlockTimestamp,
  getCurrentBlockTimestamp,
  createOptionSpec,
  createOptionOrder,
  signOptionOrder,
  getCurrentPrice,
  isWeekend,
  isAfterHours,
  getNextMarketOpen,
  calculateIntrinsicValue,
  calculateRequiredCollateral,
  trackGasUsage,
  expectBigNumberEqual,
  expectBigNumberCloseTo,
  expectRevert
};