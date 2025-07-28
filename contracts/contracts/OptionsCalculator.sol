// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SignedMath.sol";

/**
 * @title OptionsCalculator
 * @dev Advanced options pricing engine with Black-Scholes, implied volatility,
 * Monte Carlo simulations, and strategy modeling
 */
contract OptionsCalculator is ReentrancyGuard, AccessControl, Pausable {
    using Math for uint256;
    using SignedMath for int256;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant CALCULATOR_KEEPER_ROLE = keccak256("CALCULATOR_KEEPER_ROLE");
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MAX_ITERATIONS = 100;
    uint256 public constant CONVERGENCE_THRESHOLD = 1e15; // 0.001
    
    // Mathematical constants (scaled by 1e18)
    uint256 public constant SQRT_2PI = 2506628274631000502; // sqrt(2*π) * 1e18
    uint256 public constant E = 2718281828459045235; // e * 1e18
    uint256 public constant PI = 3141592653589793238; // π * 1e18
    uint256 public constant SQRT_2 = 1414213562373095048; // sqrt(2) * 1e18

    // ============ Enums ============
    
    enum OptionType { CALL, PUT }
    enum OptionStyle { EUROPEAN, AMERICAN }
    enum AssetType { CRYPTO, FOREX, STOCK }
    enum PricingModel { BLACK_SCHOLES, BINOMIAL, MONTE_CARLO, HESTON }

    // ============ Structs ============
    
    struct OptionParameters {
        uint256 underlyingPrice;    // Current underlying price
        uint256 strikePrice;        // Strike price
        uint256 timeToExpiry;       // Time to expiry in seconds
        uint256 volatility;         // Implied volatility (annualized)
        uint256 riskFreeRate;       // Risk-free rate (annualized)
        uint256 dividendYield;      // Dividend yield (for stocks)
        OptionType optionType;      // CALL or PUT
        OptionStyle style;          // EUROPEAN or AMERICAN
    }

    struct Greeks {
        int256 delta;      // Price sensitivity (1e18 scale)
        int256 gamma;      // Delta sensitivity (1e18 scale)
        int256 theta;      // Time decay per day (1e18 scale)
        int256 vega;       // Volatility sensitivity (1e18 scale)
        int256 rho;        // Interest rate sensitivity (1e18 scale)
        int256 epsilon;    // Dividend sensitivity (1e18 scale)
    }

    struct PricingResult {
        uint256 optionPrice;        // Theoretical option price
        Greeks greeks;              // Option Greeks
        uint256 intrinsicValue;     // Intrinsic value
        uint256 timeValue;          // Time value
        uint256 impliedVolatility;  // Implied volatility
        PricingModel model;         // Pricing model used
        uint256 confidence;         // Confidence in pricing (0-10000)
        uint256 timestamp;          // Calculation timestamp
    }

    struct VolatilitySurface {
        mapping(uint256 => mapping(uint256 => uint256)) volatilities; // strike => expiry => vol
        uint256[] strikes;          // Available strike prices
        uint256[] expiries;         // Available expiry times
        uint256 lastUpdate;         // Last surface update
        bool isActive;              // Whether surface is active
    }

    struct MonteCarloConfig {
        uint256 numSimulations;     // Number of simulation paths
        uint256 numTimeSteps;       // Time steps per simulation
        uint256 seed;               // Random seed
        bool antitheticVariates;    // Use antithetic variates
        bool controlVariates;       // Use control variates
    }

    struct BinomialConfig {
        uint256 numSteps;           // Number of binomial steps
        bool americanEarlyExercise; // Enable early exercise for American options
        uint256 convergenceTolerance; // Convergence tolerance
    }

    struct StrategyComponent {
        OptionType optionType;      // CALL or PUT
        uint256 strikePrice;        // Strike price
        uint256 quantity;           // Number of contracts
        bool isLong;                // Long or short position
        uint256 premium;            // Option premium
    }

    struct StrategyAnalysis {
        int256 maxProfit;           // Maximum profit potential
        int256 maxLoss;             // Maximum loss potential
        uint256[] breakevens;       // Breakeven points
        int256 netPremium;          // Net premium paid/received
        Greeks totalGreeks;         // Combined Greeks
        uint256 probabilityProfit;  // Probability of profit
    }

    // ============ State Variables ============
    
    mapping(string => VolatilitySurface) public volatilitySurfaces;
    mapping(string => uint256) public impliedVolatilities;
    mapping(string => uint256) public historicalVolatilities;
    mapping(string => uint256) public riskFreeRates;
    mapping(string => uint256) public dividendYields;
    
    // Pricing model configurations
    MonteCarloConfig public monteCarloConfig;
    BinomialConfig public binomialConfig;
    
    // Model selection preferences
    mapping(AssetType => PricingModel) public defaultPricingModels;
    mapping(string => PricingModel) public assetPricingModels;
    
    // Calculation cache for gas optimization
    mapping(bytes32 => PricingResult) public pricingCache;
    uint256 public cacheExpiryTime = 300; // 5 minutes
    
    // Protocol parameters
    uint256 public maxVolatility = 500 * PRECISION / 100; // 500% max volatility
    uint256 public minTimeToExpiry = 1 hours; // Minimum time to expiry for pricing
    uint256 public maxTimeToExpiry = 2 * 365 days; // Maximum time to expiry
    bool public cachingEnabled = true;
    
    // Advanced features
    bool public volatilitySurfaceEnabled = true;
    bool public stochasticVolatilityEnabled = false;
    bool public jumpDiffusionEnabled = false;

    // ============ Events ============
    
    event OptionPriced(
        string indexed underlying,
        OptionType optionType,
        uint256 strikePrice,
        uint256 timeToExpiry,
        uint256 optionPrice,
        PricingModel model
    );

    event ImpliedVolatilityCalculated(
        string indexed underlying,
        uint256 marketPrice,
        uint256 impliedVolatility,
        uint256 iterations
    );

    event VolatilitySurfaceUpdated(
        string indexed underlying,
        uint256 strikes,
        uint256 expiries,
        uint256 timestamp
    );

    event StrategyAnalyzed(
        bytes32 indexed strategyId,
        int256 maxProfit,
        int256 maxLoss,
        uint256 probabilityProfit
    );

    // ============ Modifiers ============
    
    modifier validParameters(OptionParameters memory params) {
        require(params.underlyingPrice > 0, "Invalid underlying price");
        require(params.strikePrice > 0, "Invalid strike price");
        require(params.timeToExpiry >= minTimeToExpiry, "Time to expiry too short");
        require(params.timeToExpiry <= maxTimeToExpiry, "Time to expiry too long");
        require(params.volatility > 0 && params.volatility <= maxVolatility, "Invalid volatility");
        require(params.riskFreeRate <= 100 * PRECISION / 100, "Invalid risk-free rate");
        _;
    }

    modifier onlyCalculatorKeeper() {
        require(hasRole(CALCULATOR_KEEPER_ROLE, msg.sender), "Only calculator keeper");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(CALCULATOR_KEEPER_ROLE, _admin);
        
        _initializeDefaultConfigurations();
        _initializeDefaultPricingModels();
    }

    // ============ Core Pricing Functions ============
    
    /**
     * @dev Calculates option price using specified model
     */
    function calculateOptionPrice(
        OptionParameters calldata params,
        PricingModel model
    ) external view validParameters(params) returns (PricingResult memory result) {
        // Check cache first
        bytes32 cacheKey = _getCacheKey(params, model);
        if (cachingEnabled && _isCacheValid(cacheKey)) {
            return pricingCache[cacheKey];
        }
        
        // Calculate based on selected model
        if (model == PricingModel.BLACK_SCHOLES) {
            result = _calculateBlackScholes(params);
        } else if (model == PricingModel.BINOMIAL) {
            result = _calculateBinomial(params);
        } else if (model == PricingModel.MONTE_CARLO) {
            result = _calculateMonteCarlo(params);
        } else if (model == PricingModel.HESTON) {
            result = _calculateHeston(params);
        } else {
            revert("Unsupported pricing model");
        }
        
        result.model = model;
        result.timestamp = block.timestamp;
        
        return result;
    }

    // ============ Internal Functions ============
    
    function _calculateBlackScholes(OptionParameters memory params) 
        internal 
        view 
        returns (PricingResult memory result) 
    {
        uint256 timeToExpiryYears = (params.timeToExpiry * PRECISION) / SECONDS_PER_YEAR;
        
        if (timeToExpiryYears == 0) {
            // At expiry, only intrinsic value
            uint256 intrinsic;
            if (params.optionType == OptionType.CALL) {
                intrinsic = params.underlyingPrice > params.strikePrice ? 
                    params.underlyingPrice - params.strikePrice : 0;
            } else {
                intrinsic = params.strikePrice > params.underlyingPrice ? 
                    params.strikePrice - params.underlyingPrice : 0;
            }
            
            result.optionPrice = intrinsic;
            result.intrinsicValue = intrinsic;
            result.timeValue = 0;
            // Greeks are zero at expiry except delta
            result.greeks.delta = params.optionType == OptionType.CALL ? 
                (params.underlyingPrice >= params.strikePrice ? int256(PRECISION) : int256(0)) :
                (params.strikePrice >= params.underlyingPrice ? -int256(PRECISION) : int256(0));
            
            return result;
        }
        
        // Calculate d1 and d2
        (int256 d1, int256 d2) = _calculateD1D2(
            params.underlyingPrice,
            params.strikePrice,
            params.riskFreeRate,
            params.dividendYield,
            params.volatility,
            timeToExpiryYears
        );
        
        // Calculate standard normal CDF and PDF values
        uint256 nd1 = _normalCDF(d1);
        uint256 nd2 = _normalCDF(d2);
        uint256 nMinusD1 = _normalCDF(-d1);
        uint256 nMinusD2 = _normalCDF(-d2);
        uint256 npd1 = _normalPDF(d1);
        
        // Calculate discount factors
        uint256 discountFactor = _exp(-int256((params.riskFreeRate * timeToExpiryYears) / PRECISION));
        uint256 dividendDiscountFactor = _exp(-int256((params.dividendYield * timeToExpiryYears) / PRECISION));
        
        // Calculate option price
        uint256 optionPrice;
        if (params.optionType == OptionType.CALL) {
            uint256 term1 = (params.underlyingPrice * dividendDiscountFactor * nd1) / PRECISION;
            uint256 term2 = (params.strikePrice * discountFactor * nd2) / PRECISION;
            optionPrice = term1 > term2 ? term1 - term2 : 0;
        } else {
            uint256 term1 = (params.strikePrice * discountFactor * nMinusD2) / PRECISION;
            uint256 term2 = (params.underlyingPrice * dividendDiscountFactor * nMinusD1) / PRECISION;
            optionPrice = term1 > term2 ? term1 - term2 : 0;
        }
        
        // Calculate Greeks
        Greeks memory greeks = _calculateBlackScholesGreeks(
            params,
            d1,
            d2,
            nd1,
            nd2,
            nMinusD1,
            nMinusD2,
            npd1,
            discountFactor,
            dividendDiscountFactor,
            timeToExpiryYears
        );
        
        // Calculate intrinsic and time value
        uint256 intrinsicValue;
        if (params.optionType == OptionType.CALL) {
            intrinsicValue = params.underlyingPrice > params.strikePrice ? 
                params.underlyingPrice - params.strikePrice : 0;
        } else {
            intrinsicValue = params.strikePrice > params.underlyingPrice ? 
                params.strikePrice - params.underlyingPrice : 0;
        }
        
        uint256 timeValue = optionPrice > intrinsicValue ? optionPrice - intrinsicValue : 0;
        
        return PricingResult({
            optionPrice: optionPrice,
            greeks: greeks,
            intrinsicValue: intrinsicValue,
            timeValue: timeValue,
            impliedVolatility: params.volatility,
            model: PricingModel.BLACK_SCHOLES,
            confidence: 9500, // 95% confidence for Black-Scholes
            timestamp: block.timestamp
        });
    }

    function _calculateBlackScholesGreeks(
        OptionParameters memory params,
        int256 d1,
        int256 d2,
        uint256 nd1,
        uint256 nd2,
        uint256 nMinusD1,
        uint256 nMinusD2,
        uint256 npd1,
        uint256 discountFactor,
        uint256 dividendDiscountFactor,
        uint256 timeToExpiryYears
    ) internal pure returns (Greeks memory greeks) {
        
        // Delta
        if (params.optionType == OptionType.CALL) {
            greeks.delta = int256((dividendDiscountFactor * nd1) / PRECISION);
        } else {
            greeks.delta = -int256((dividendDiscountFactor * nMinusD1) / PRECISION);
        }
        
        // Gamma (same for calls and puts)
        uint256 sqrtT = _sqrt(timeToExpiryYears);
        greeks.gamma = int256((dividendDiscountFactor * npd1) / (params.underlyingPrice * params.volatility * sqrtT / PRECISION));
        
        // Theta
        uint256 term1 = (params.underlyingPrice * npd1 * params.volatility * dividendDiscountFactor) / (2 * sqrtT);
        uint256 term2 = (params.riskFreeRate * params.strikePrice * discountFactor) / PRECISION;
        uint256 term3 = (params.dividendYield * params.underlyingPrice * dividendDiscountFactor) / PRECISION;
        
        if (params.optionType == OptionType.CALL) {
            greeks.theta = -int256((term1 + (term2 * nd2) / PRECISION - (term3 * nd1) / PRECISION) * PRECISION / 365);
        } else {
            greeks.theta = -int256((term1 - (term2 * nMinusD2) / PRECISION + (term3 * nMinusD1) / PRECISION) * PRECISION / 365);
        }
        
        // Vega (same for calls and puts)
        greeks.vega = int256((params.underlyingPrice * dividendDiscountFactor * npd1 * sqrtT) / (100 * PRECISION));
        
        // Rho
        uint256 rhoTerm = (params.strikePrice * timeToExpiryYears * discountFactor) / (100 * PRECISION);
        if (params.optionType == OptionType.CALL) {
            greeks.rho = int256((rhoTerm * nd2) / PRECISION);
        } else {
            greeks.rho = -int256((rhoTerm * nMinusD2) / PRECISION);
        }
        
        // Epsilon (dividend sensitivity)
        uint256 epsilonTerm = (params.underlyingPrice * timeToExpiryYears * dividendDiscountFactor) / (100 * PRECISION);
        if (params.optionType == OptionType.CALL) {
            greeks.epsilon = -int256((epsilonTerm * nd1) / PRECISION);
        } else {
            greeks.epsilon = int256((epsilonTerm * nMinusD1) / PRECISION);
        }
        
        return greeks;
    }

    // Additional internal helper functions would go here...
    
    function _calculateD1D2(
        uint256 underlyingPrice,
        uint256 strikePrice,
        uint256 riskFreeRate,
        uint256 dividendYield,
        uint256 volatility,
        uint256 timeToExpiryYears
    ) internal pure returns (int256 d1, int256 d2) {
        // Simplified implementation - would need full math library
        // This is a placeholder for the actual calculation
        d1 = 0;
        d2 = 0;
    }
    
    function _normalCDF(int256 x) internal pure returns (uint256) {
        // Simplified implementation - would need full math library
        return PRECISION / 2; // Placeholder
    }
    
    function _normalPDF(int256 x) internal pure returns (uint256) {
        // Simplified implementation - would need full math library  
        return PRECISION / 4; // Placeholder
    }
    
    function _exp(int256 x) internal pure returns (uint256) {
        // Simplified implementation - would need full math library
        return PRECISION; // Placeholder
    }
    
    function _sqrt(uint256 x) internal pure returns (uint256) {
        // Basic square root implementation
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // Placeholder implementations for other functions
    function _calculateBinomial(OptionParameters memory) internal pure returns (PricingResult memory) {
        // Placeholder
        return PricingResult({
            optionPrice: 0,
            greeks: Greeks(0,0,0,0,0,0),
            intrinsicValue: 0,
            timeValue: 0,
            impliedVolatility: 0,
            model: PricingModel.BINOMIAL,
            confidence: 0,
            timestamp: 0
        });
    }
    
    function _calculateMonteCarlo(OptionParameters memory) internal pure returns (PricingResult memory) {
        // Placeholder
        return PricingResult({
            optionPrice: 0,
            greeks: Greeks(0,0,0,0,0,0),
            intrinsicValue: 0,
            timeValue: 0,
            impliedVolatility: 0,
            model: PricingModel.MONTE_CARLO,
            confidence: 0,
            timestamp: 0
        });
    }
    
    function _calculateHeston(OptionParameters memory) internal pure returns (PricingResult memory) {
        // Placeholder
        return PricingResult({
            optionPrice: 0,
            greeks: Greeks(0,0,0,0,0,0),
            intrinsicValue: 0,
            timeValue: 0,
            impliedVolatility: 0,
            model: PricingModel.HESTON,
            confidence: 0,
            timestamp: 0
        });
    }

    function _getCacheKey(OptionParameters memory, PricingModel) internal pure returns (bytes32) {
        return bytes32(0); // Placeholder
    }
    
    function _isCacheValid(bytes32) internal view returns (bool) {
        return false; // Placeholder
    }
    
    function _initializeDefaultConfigurations() internal {
        // Placeholder
    }
    
    function _initializeDefaultPricingModels() internal {
        // Placeholder  
    }
}