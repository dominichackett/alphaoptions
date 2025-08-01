// test/fixtures/existing-deployment.js
const { ethers } = require("hardhat");

// Load your deployed contracts
async function loadExistingDeployment() {
  const deployment = require("../../deployments/mainnet-fork.json");
  const [deployer, user1, user2, liquidator] = await ethers.getSigners();

  // Connect to your deployed contracts
  const contracts = {
    priceOracle: await ethers.getContractAt("PriceOracle", deployment.contracts.PriceOracle),
    optionsCalculator: await ethers.getContractAt("OptionsCalculator", deployment.contracts.OptionsCalculator),
    collateralVault: await ethers.getContractAt("CollateralVault", deployment.contracts.CollateralVault),
    settlementEngine: await ethers.getContractAt("SettlementEngine", deployment.contracts.SettlementEngine),
    riskManager: await ethers.getContractAt("RiskManager", deployment.contracts.RiskManager),
    optionsProtocol: await ethers.getContractAt("OptionsProtocol", deployment.contracts.OptionsProtocol)
  };

  // Connect to external contracts
  const external = {
    weth: await ethers.getContractAt("IERC20", deployment.external.WETH),
    usdc: await ethers.getContractAt("IERC20", deployment.external.USDC),
    ethOracle: await ethers.getContractAt("AggregatorV3Interface", deployment.external.ETHOracle),
    btcOracle: await ethers.getContractAt("AggregatorV3Interface", deployment.external.BTCOracle)
  };

  // Get some accounts with real WETH and USDC by impersonating whales
  const wethWhale = "0x8EB8a3b98659Cce290402893d0123abb75E3ab28"; // Random WETH holder
  const usdcWhale = "0x55FE002aefF02F77364de339a1292923A15844B8"; // Circle USDC treasury
  
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [wethWhale]
  });
  
  await network.provider.request({
    method: "hardhat_impersonateAccount", 
    params: [usdcWhale]
  });

  const wethHolder = await ethers.getSigner(wethWhale);
  const usdcHolder = await ethers.getSigner(usdcWhale);

  // Fund the whale accounts with ETH for gas
  await deployer.sendTransaction({
    to: wethWhale,
    value: ethers.parseEther("10")
  });
  
  await deployer.sendTransaction({
    to: usdcWhale, 
    value: ethers.parseEther("10")
  });

  // Transfer tokens to test users
  await external.weth.connect(wethHolder).transfer(user1.address, ethers.parseEther("100"));
  await external.weth.connect(wethHolder).transfer(user2.address, ethers.parseEther("100"));
  
  await external.usdc.connect(usdcHolder).transfer(user1.address, ethers.parseUnits("100000", 6));
  await external.usdc.connect(usdcHolder).transfer(user2.address, ethers.parseUnits("100000", 6));

  return {
    contracts,
    external,
    accounts: {
      deployer,
      user1,
      user2,
      liquidator,
      wethHolder,
      usdcHolder
    },
    deployment
  };
}

module.exports = {
  loadExistingDeployment
};