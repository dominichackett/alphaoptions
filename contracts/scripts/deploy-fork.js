const { ethers } = require("hardhat");
const ADDRESSES = require("./mainnet-addresses");

const overrides = {
  maxFeePerGas: ethers.parseUnits("100", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
  gasLimit: 15000000
};

async function main() {
  console.log("🍴 Deploying on Mainnet Fork...");
  console.log(ADDRESSES);
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deployer:", deployer.address);
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  console.log("Block Number:", await ethers.provider.getBlockNumber());
  
  // Deploy your contracts
  console.log("\n🏗️ Deploying Options System...");

  try {
    // 1. Price Oracle
    console.log("Deploying PriceOracle...");
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy(deployer.address, overrides);
    await priceOracle.waitForDeployment();
    const priceOracleAddress = await priceOracle.getAddress();
    console.log("✅ PriceOracle deployed to:", priceOracleAddress);

    // 2. Options Calculator  
    console.log("Deploying OptionsCalculator...");
    const OptionsCalculator = await ethers.getContractFactory("OptionsCalculator");
    const optionsCalculator = await OptionsCalculator.deploy(deployer.address, overrides);
    await optionsCalculator.waitForDeployment();
    const optionsCalculatorAddress = await optionsCalculator.getAddress();
    console.log("✅ OptionsCalculator deployed to:", optionsCalculatorAddress);

    // 3. Collateral Vault
    console.log("Deploying CollateralVault...");
    const CollateralVault = await ethers.getContractFactory("CollateralVault");
    const collateralVault = await CollateralVault.deploy(
      deployer.address,
      ethers.ZeroAddress, // Will set later
      deployer.address,
      overrides
    );
    await collateralVault.waitForDeployment();
    const collateralVaultAddress = await collateralVault.getAddress();
    console.log("✅ CollateralVault deployed to:", collateralVaultAddress);

    // 4. Settlement Engine
    console.log("Deploying SettlementEngine...");
    const SettlementEngine = await ethers.getContractFactory("SettlementEngine");
    const settlementEngine = await SettlementEngine.deploy(
      deployer.address,
      ethers.ZeroAddress, // Will set later
      collateralVaultAddress,
      deployer.address,
      overrides
    );
    await settlementEngine.waitForDeployment();
    const settlementEngineAddress = await settlementEngine.getAddress();
    console.log("✅ SettlementEngine deployed to:", settlementEngineAddress);

    // 5. Risk Manager
    console.log("Deploying RiskManager...");
    const RiskManager = await ethers.getContractFactory("RiskManager");
    const riskManager = await RiskManager.deploy(
      deployer.address,
      ethers.ZeroAddress, // Will set later
      collateralVaultAddress,
      priceOracleAddress,
      overrides
    );
    await riskManager.waitForDeployment();
    const riskManagerAddress = await riskManager.getAddress();
    console.log("✅ RiskManager deployed to:", riskManagerAddress);

    // 6. Options Protocol (integrates with real 1inch)
    console.log("Deploying OptionsProtocol...");
    const OptionsProtocol = await ethers.getContractFactory("OptionsProtocol");
    const optionsProtocol = await OptionsProtocol.deploy(
      deployer.address,
      deployer.address,
      "DefiOptionsProtocol",
      "1.0",
      overrides
    );
    await optionsProtocol.waitForDeployment();
    const optionsProtocolAddress = await optionsProtocol.getAddress();
    console.log("✅ OptionsProtocol deployed to:", optionsProtocolAddress);

    // Configure relationships
    console.log("\n⚙️ Configuring Contracts...");
    
    await optionsProtocol.setCollateralVault(collateralVaultAddress);
    await optionsProtocol.setSettlementEngine(settlementEngineAddress);
    await optionsProtocol.setRiskManager(riskManagerAddress);
    await optionsProtocol.setOptionsCalculator(optionsCalculatorAddress);

    // Grant roles
    const OPTIONS_PROTOCOL_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("OPTIONS_PROTOCOL_ROLE")
    );
    
    await collateralVault.grantRole(OPTIONS_PROTOCOL_ROLE, optionsProtocolAddress);
    await settlementEngine.grantRole(OPTIONS_PROTOCOL_ROLE, optionsProtocolAddress);
    await riskManager.grantRole(OPTIONS_PROTOCOL_ROLE, optionsProtocolAddress);

    // Configure Price Oracle with real Chainlink feeds
    console.log("\n📊 Configuring Real Price Feeds...");
    
    // Add ETH with real Chainlink oracle
    await priceOracle.addAsset("ETH", 0, 1, 500); // CRYPTO, 1 source, 5% deviation
    await priceOracle.addPriceSource(
      "ETH",
      0, // CHAINLINK
      ADDRESSES.ORACLES.ETH_USD,
      10000, // 100% weight
      3600,  // 1 hour staleness
      8,     // 8 decimals
      "ETH/USD Chainlink Mainnet"
    );

    // Add BTC
    await priceOracle.addAsset("BTC", 0, 1, 500);
    await priceOracle.addPriceSource(
      "BTC",
      0,
      ADDRESSES.ORACLES.BTC_USD,
      10000,
      3600,
      8,
      "BTC/USD Chainlink Mainnet"
    );

    // Configure collateral with real tokens
    console.log("\n💰 Configuring Real Collateral Tokens...");
    
    // WETH as collateral
    await collateralVault.setTokenConfig(
      ADDRESSES.TOKENS.WETH,
      true,  // accepted
      15000, // 150% collateral factor
      12000, // 120% liquidation threshold
      ethers.parseEther("1000"), // 1000 WETH max exposure
      false, // not stable
      0      // no yield for now
    );

    // USDC as collateral/premium
    await collateralVault.setTokenConfig(
      ADDRESSES.TOKENS.USDC,
      true,
      15000,
      12000,
      ethers.parseUnits("1000000", 6), // 1M USDC
      true,  // is stable
      0
    );

    // Set asset oracles
    await optionsProtocol.setAssetOracle("ETH", ADDRESSES.ORACLES.ETH_USD);
    await optionsProtocol.setAssetOracle("BTC", ADDRESSES.ORACLES.BTC_USD);

    console.log("\n✅ Fork Deployment Complete!");
    
    // Save deployment info
    const deploymentInfo = {
      network: "mainnet-fork",
      chainId: network.chainId.toString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        PriceOracle: priceOracleAddress,
        OptionsCalculator: optionsCalculatorAddress,  
        CollateralVault: collateralVaultAddress,
        SettlementEngine: settlementEngineAddress,
        RiskManager: riskManagerAddress,
        OptionsProtocol: optionsProtocolAddress
      },
      external: {
        InchLimitOrderProtocol: ADDRESSES.INCH.LIMIT_ORDER_PROTOCOL_V2,
        WETH: ADDRESSES.TOKENS.WETH,
        USDC: ADDRESSES.TOKENS.USDC,
        ETHOracle: ADDRESSES.ORACLES.ETH_USD,
        BTCOracle: ADDRESSES.ORACLES.BTC_USD
      }
    };

    const fs = require("fs");
    if (!fs.existsSync("./deployments")) {
      fs.mkdirSync("./deployments");
    }
    
    fs.writeFileSync(
      "./deployments/mainnet-fork.json",
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to deployments/mainnet-fork.json");
    
    // Display summary
    console.log("\n🎉 DEPLOYMENT SUMMARY:");
    console.log("==========================================");
    console.log(`Network: Mainnet Fork (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
    console.log("\n📋 CONTRACT ADDRESSES:");
    console.log(`PriceOracle:       ${priceOracleAddress}`);
    console.log(`OptionsCalculator: ${optionsCalculatorAddress}`);
    console.log(`CollateralVault:   ${collateralVaultAddress}`);
    console.log(`SettlementEngine:  ${settlementEngineAddress}`);
    console.log(`RiskManager:       ${riskManagerAddress}`);
    console.log(`OptionsProtocol:   ${optionsProtocolAddress}`);
    console.log("\n🔗 INTEGRATED SERVICES:");
    console.log(`Chainlink ETH/USD: ${ADDRESSES.ORACLES.ETH_USD}`);
    console.log(`Chainlink BTC/USD: ${ADDRESSES.ORACLES.BTC_USD}`);
    console.log(`1inch Protocol:    ${ADDRESSES.INCH.LIMIT_ORDER_PROTOCOL_V2}`);
    console.log(`WETH Token:        ${ADDRESSES.TOKENS.WETH}`);
    console.log(`USDC Token:        ${ADDRESSES.TOKENS.USDC}`);
    console.log("\n✅ Ready for testing with real mainnet data!");
    
    return deploymentInfo;

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    throw error;
  }
}

// Enhanced error handling
main()
  .then((deploymentInfo) => {
    console.log("\n🚀 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed with error:");
    console.error(error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.code) {
      console.error("Error Code:", error.code);
    }
    process.exit(1);
  });

module.exports = { main };