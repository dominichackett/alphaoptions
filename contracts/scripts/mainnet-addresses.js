// scripts/mainnet-addresses.js
module.exports = {
  // 1inch Protocol Addresses
  INCH: {
    LIMIT_ORDER_PROTOCOL_V4: "0x111111125421ca6dc452d289314280a0f8842a65", // Latest v4
    LIMIT_ORDER_PROTOCOL_V3: "0x1111111254eeb25477b68fb85ed929f73a960582", // Fallback v3
    AGGREGATION_ROUTER_V5: "0x1111111254fb6c44bAC0beD2854e76F90643097d",
    SPOT_PRICE_AGGREGATOR: "0x0AdDd25a91563696D8567Df78D5A01C9a991F9B8"
  },

  // Token Addresses  
  TOKENS: {
    WETH: "0xC02aaA39b223FE8C0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86a33E6411a3B76e64E2C8C5C3b0e7E0b2c3D", 
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
  },

  // Chainlink Price Oracles
  ORACLES: {
    ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    BTC_USD: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    USDC_USD: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    DAI_USD: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
  },

  // Known Whale Addresses for Testing
  WHALES: {
    WETH: "0x8EB8a3b98659Cce290402893d0123abb75E3ab28",
    USDC: "0x55FE002aefF02F77364de339a1292923A15844B8", 
    USDT: "0x5754284f345afc66a98fbB0a0Afe71e0F007B949",
    DAI: "0x66F62574ab04989737228D18C3624f7FC1edAe14"
  }
};

module.exports = MAINNET_ADDRESSES;