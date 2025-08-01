// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SignedMath.sol";

/**
 * @title RiskManager
 * @dev Advanced risk management system with Greeks calculation, portfolio monitoring,
 * and position limits for multi-asset options trading
 */
contract RiskManager is ReentrancyGuard, AccessControl, Pausable {
    using Math for uint256;
    using SignedMath for int256;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RISK_KEEPER_ROLE = keccak256("RISK_KEEPER_ROLE");
    bytes32 public constant OPTIONS_PROTOCOL_ROLE = keccak256("OPTIONS_PROTOCOL_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MAX_PORTFOLIO_DELTA = 1000 * PRECISION;
    uint256 public constant MAX_PORTFOLIO_GAMMA = 500 * PRECISION;
    uint256 public constant MAX_PORTFOLIO_VEGA = 2000 * PRECISION;
    
    // Mathematical constants (scaled by 1e18)
    uint256 public constant SQRT_2PI = 2506628274631000502;
    uint256 public constant E = 2718281828459045235;

    // ============ Enums ============
    
    enum OptionType { CALL, PUT }
    enum OptionStyle { EUROPEAN, AMERICAN }
    enum AssetType { CRYPTO, FOREX, STOCK }
    enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }

    // ============ Structs ============
    
    struct OptionSpec {
        AssetType assetType;
        string underlying;
        OptionType optionType;
        OptionStyle style;
        uint256 strikePrice;
        uint256 expiryTime;
        uint256 contractSize;
        address oracle;
    }

    struct Greeks {
        int256 delta;
        int256 gamma;
        int256 theta;
        int256 vega;
        int256 rho;
    }

    struct PositionRisk {
        bytes32 optionId;
        address user;
        OptionSpec spec;
        uint256 notionalValue;
        uint256 currentPrice;
        uint256 timeToExpiry;
        Greeks greeks;
        uint256 impliedVolatility;
        uint256 riskScore;
        RiskLevel riskLevel;
        uint256 lastUpdate;
    }

    struct PortfolioRisk {
        address user;
        uint256 totalNotional;
        int256 totalDelta;
        int256 totalGamma;
        int256 totalTheta;
        int256 totalVega;
        int256 totalRho;
        uint256 portfolioVaR;
        uint256 maxDrawdown;
        uint256 sharpeRatio;
        uint256 portfolioRiskScore;
        RiskLevel portfolioRiskLevel;
        uint256 lastUpdate;
    }

    struct RiskLimits {
        uint256 maxPositionSize;
        uint256 maxPortfolioSize;
        int256 maxDelta;
        int256 maxGamma;
        int256 maxVega;
        uint256 maxVaR;
        uint256 concentrationLimit;
        bool isActive;
    }

    struct AssetRiskConfig {
        uint256 baseVolatility;
        uint256 riskFreeRate;
        uint256 maxLeverage;
        uint256 liquidationThreshold;
        uint256 correlationFactor;
        bool requiresMargin;
        uint256 marginMultiplier;
    }

    struct MarketConditions {
        uint256 vix;
        uint256 marketTrend;
        uint256 liquidityScore;
        bool isHighVolatility;
        bool isMarketStress;
        uint256 lastUpdate;
    }

    // ============ State Variables ============
    
    mapping(bytes32 => PositionRisk) public positionRisks;
    mapping(address => PortfolioRisk) public portfolioRisks;
    mapping(address => RiskLimits) public userRiskLimits;
    mapping(string => AssetRiskConfig) public assetRiskConfigs;
    mapping(address => bytes32[]) public userPositions;
    mapping(string => uint256) public impliedVolatilities;
    
    MarketConditions public marketConditions;
    
    // Default risk parameters
    RiskLimits public defaultRiskLimits;
    uint256 public defaultImpliedVolatility = 50 * PRECISION / 100;
    uint256 public defaultRiskFreeRate = 5 * PRECISION / 100;
    
    // Protocol addresses
    address public optionsProtocol;
    address public collateralVault;
    address public priceOracle;
    address public optionsCalculator;
    
    // Risk monitoring parameters
    uint256 public riskUpdateInterval = 300;
    uint256 public portfolioRebalanceThreshold = 1000;
    bool public autoLiquidationEnabled = true;
    uint256 public liquidationBuffer = 500;
    
    // Emergency controls
    bool public emergencyRiskMode;
    uint256 public emergencyRiskMultiplier = 200;
    mapping(string => bool) public assetRiskPaused;

    // ============ Events ============
    
    event PositionRiskUpdated(
        bytes32 indexed optionId,
        address indexed user,
        uint256 riskScore,
        RiskLevel riskLevel,
        Greeks greeks
    );

    event PortfolioRiskUpdated(
        address indexed user,
        uint256 portfolioVaR,
        uint256 portfolioRiskScore,
        RiskLevel riskLevel
    );

    event RiskLimitExceeded(
        address indexed user,
        string limitType,
        uint256 currentValue,
        uint256 limitValue
    );

    event LiquidationTriggered(
        address indexed user,
        bytes32 indexed optionId,
        string reason,
        uint256 riskScore
    );

    event MarketConditionsUpdated(
        uint256 vix,
        uint256 marketTrend,
        bool isHighVolatility,
        bool isMarketStress
    );

    event EmergencyRiskModeActivated(
        string reason,
        uint256 timestamp
    );

    // ============ Modifiers ============
    
    modifier onlyOptionsProtocol() {
        require(hasRole(OPTIONS_PROTOCOL_ROLE, msg.sender), "Only options protocol");
        _;
    }

    modifier onlyRiskKeeper() {
        require(hasRole(RISK_KEEPER_ROLE, msg.sender), "Only risk keeper");
        _;
    }

    modifier validPosition(bytes32 optionId) {
        require(positionRisks[optionId].optionId != bytes32(0), "Position does not exist");
        _;
    }

    modifier notEmergencyRisk() {
        require(!emergencyRiskMode, "Emergency risk mode active");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _admin,
        address _optionsProtocol,
        address _collateralVault,
        address _priceOracle
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(OPTIONS_PROTOCOL_ROLE, _optionsProtocol);
        _grantRole(RISK_KEEPER_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);
        
        optionsProtocol = _optionsProtocol;
        collateralVault = _collateralVault;
        priceOracle = _priceOracle;
        
        _initializeDefaultRiskLimits();
        _initializeDefaultAssetConfigs();
    }

    // ============ Core Risk Functions ============
    
    function addPosition(
        bytes32 optionId,
        address user,
        OptionSpec calldata spec,
        uint256 notionalValue
    ) external onlyOptionsProtocol nonReentrant whenNotPaused {
        require(positionRisks[optionId].optionId == bytes32(0), "Position already exists");
        
        PositionRisk memory risk = _calculatePositionRisk(optionId, user, spec, notionalValue);
        
        positionRisks[optionId] = risk;
        userPositions[user].push(optionId);
        
        _updatePortfolioRisk(user);
        _checkRiskLimits(user, optionId);
        
        emit PositionRiskUpdated(optionId, user, risk.riskScore, risk.riskLevel, risk.greeks);
    }

    function updatePositionRisk(bytes32 optionId) 
        external 
        nonReentrant 
        validPosition(optionId) 
        whenNotPaused 
    {
        PositionRisk storage position = positionRisks[optionId];
        
        PositionRisk memory updatedRisk = _calculatePositionRisk(
            optionId,
            position.user,
            position.spec,
            position.notionalValue
        );
        
        positionRisks[optionId] = updatedRisk;
        _updatePortfolioRisk(position.user);
        
        if (updatedRisk.riskLevel == RiskLevel.CRITICAL) {
            _checkLiquidationTrigger(optionId);
        }
        
        emit PositionRiskUpdated(optionId, position.user, updatedRisk.riskScore, updatedRisk.riskLevel, updatedRisk.greeks);
    }

    function removePosition(bytes32 optionId) 
        external 
        onlyOptionsProtocol 
        nonReentrant 
        validPosition(optionId) 
    {
        PositionRisk memory position = positionRisks[optionId];
        address user = position.user;
        
        _removeUserPosition(user, optionId);
        delete positionRisks[optionId];
        _updatePortfolioRisk(user);
    }

    function updateUserRisk(address user) external nonReentrant whenNotPaused {
        bytes32[] memory positions = userPositions[user];
        
        for (uint256 i = 0; i < positions.length; i++) {
            if (positionRisks[positions[i]].optionId != bytes32(0)) {
                this.updatePositionRisk(positions[i]);
            }
        }
    }

    function batchUpdateRisk(address[] calldata users) 
        external 
        onlyRiskKeeper 
        nonReentrant 
        whenNotPaused 
    {
        for (uint256 i = 0; i < users.length; i++) {
            bytes32[] memory positions = userPositions[users[i]];
            
            for (uint256 j = 0; j < positions.length; j++) {
                if (positionRisks[positions[j]].optionId != bytes32(0)) {
                    _updatePositionRiskInternal(positions[j]);
                }
            }
            
            _updatePortfolioRisk(users[i]);
        }
    }

    // ============ Greeks Calculation ============
    
    function calculateGreeks(
        OptionSpec calldata spec,
        uint256 currentPrice,
        uint256 timeToExpiry,
        uint256 impliedVol,
        uint256 riskFreeRate
    ) external view returns (Greeks memory greeks) {
        return _calculateGreeks(
            spec.optionType,
            currentPrice,
            spec.strikePrice,
            timeToExpiry,
            impliedVol,
            riskFreeRate,
            spec.contractSize
        );
    }

    function getPositionGreeks(bytes32 optionId) 
        external 
        view 
        validPosition(optionId) 
        returns (Greeks memory) 
    {
        return positionRisks[optionId].greeks;
    }

    function getPortfolioGreeks(address user) 
        external 
        view 
        returns (
            int256 totalDelta,
            int256 totalGamma,
            int256 totalTheta,
            int256 totalVega,
            int256 totalRho
        ) 
    {
        PortfolioRisk memory portfolio = portfolioRisks[user];
        return (
            portfolio.totalDelta,
            portfolio.totalGamma,
            portfolio.totalTheta,
            portfolio.totalVega,
            portfolio.totalRho
        );
    }

    // ============ Risk Limits and Monitoring ============
    
    function canOpenPosition(
        address user,
        OptionSpec calldata spec,
        uint256 notionalValue
    ) external view returns (bool canOpen, string memory reason) {
        RiskLimits memory limits = _getUserRiskLimits(user);
        PortfolioRisk memory portfolio = portfolioRisks[user];
        
        if (notionalValue > limits.maxPositionSize) {
            return (false, "Position size exceeds limit");
        }
        
        if (portfolio.totalNotional + notionalValue > limits.maxPortfolioSize) {
            return (false, "Portfolio size limit exceeded");
        }
        
        AssetRiskConfig memory assetConfig = assetRiskConfigs[spec.underlying];
        if (!assetConfig.requiresMargin && notionalValue > assetConfig.maxLeverage) {
            return (false, "Asset leverage limit exceeded");
        }
        
        uint256 assetExposure = _getAssetExposure(user, spec.underlying);
        uint256 concentrationPct = ((assetExposure + notionalValue) * 10000) / 
                                  (portfolio.totalNotional + notionalValue);
        
        if (concentrationPct > limits.concentrationLimit) {
            return (false, "Asset concentration limit exceeded");
        }
        
        if (emergencyRiskMode || assetRiskPaused[spec.underlying]) {
            return (false, "Emergency risk controls active");
        }
        
        return (true, "");
    }

    function setUserRiskLimits(address user, RiskLimits calldata limits) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(limits.maxPositionSize > 0, "Invalid position size limit");
        require(limits.maxPortfolioSize >= limits.maxPositionSize, "Invalid portfolio size limit");
        require(limits.concentrationLimit <= 10000, "Invalid concentration limit");
        
        userRiskLimits[user] = limits;
    }

    function getUserRiskLimits(address user) external view returns (RiskLimits memory) {
        return _getUserRiskLimits(user);
    }

    // ============ Liquidation Functions ============
    
    function checkLiquidation(bytes32 optionId) 
        external 
        view 
        validPosition(optionId) 
        returns (bool needsLiquidation, string memory reason) 
    {
        PositionRisk memory position = positionRisks[optionId];
        
        if (position.riskLevel == RiskLevel.CRITICAL) {
            return (true, "Critical risk level");
        }
        
        PortfolioRisk memory portfolio = portfolioRisks[position.user];
        RiskLimits memory limits = _getUserRiskLimits(position.user);
        
        if (portfolio.portfolioVaR > limits.maxVaR) {
            return (true, "Portfolio VaR exceeded");
        }
        
        if (_abs(portfolio.totalDelta) > _abs(limits.maxDelta) ||
            _abs(portfolio.totalGamma) > _abs(limits.maxGamma) ||
            _abs(portfolio.totalVega) > _abs(limits.maxVega)) {
            return (true, "Greeks limits exceeded");
        }
        
        return (false, "");
    }

    function triggerLiquidation(bytes32 optionId, string calldata reason) 
        external 
        onlyRiskKeeper 
        nonReentrant 
        validPosition(optionId) 
    {
        require(autoLiquidationEnabled, "Auto liquidation disabled");
        
        PositionRisk memory position = positionRisks[optionId];
        
        (bool needsLiquidation,) = this.checkLiquidation(optionId);
        require(needsLiquidation, "Liquidation not justified");
        
        _executeLiquidation(optionId, reason);
        
        emit LiquidationTriggered(position.user, optionId, reason, position.riskScore);
    }

    // ============ Market Conditions ============
    
    function updateMarketConditions(
        uint256 vix,
        uint256 marketTrend,
        uint256 liquidityScore
    ) external onlyRiskKeeper {
        bool wasHighVolatility = marketConditions.isHighVolatility;
        bool wasMarketStress = marketConditions.isMarketStress;
        
        marketConditions = MarketConditions({
            vix: vix,
            marketTrend: marketTrend,
            liquidityScore: liquidityScore,
            isHighVolatility: vix > 30 * PRECISION / 100,
            isMarketStress: liquidityScore < 50 * PRECISION / 100,
            lastUpdate: block.timestamp
        });
        
        if (!wasHighVolatility && marketConditions.isHighVolatility ||
            !wasMarketStress && marketConditions.isMarketStress) {
            
            if (vix > 50 * PRECISION / 100 || liquidityScore < 25 * PRECISION / 100) {
                _activateEmergencyRiskMode("Extreme market conditions");
            }
        }
        
        emit MarketConditionsUpdated(vix, marketTrend, marketConditions.isHighVolatility, marketConditions.isMarketStress);
    }

    function updateImpliedVolatility(string calldata asset, uint256 impliedVol) 
        external 
        onlyRiskKeeper 
    {
        require(impliedVol > 0 && impliedVol <= 500 * PRECISION / 100, "Invalid volatility");
        impliedVolatilities[asset] = impliedVol;
    }

    // ============ Analytics and Reporting ============
    
    function getRiskReport(address user) 
        external 
        view 
        returns (
            PortfolioRisk memory portfolio,
            PositionRisk[] memory positions,
            RiskLimits memory limits,
            bool[] memory limitBreaches
        ) 
    {
        portfolio = portfolioRisks[user];
        limits = _getUserRiskLimits(user);
        
        bytes32[] memory userPositionIds = userPositions[user];
        positions = new PositionRisk[](userPositionIds.length);
        
        for (uint256 i = 0; i < userPositionIds.length; i++) {
            positions[i] = positionRisks[userPositionIds[i]];
        }
        
        limitBreaches = new bool[](6);
        limitBreaches[0] = portfolio.totalNotional > limits.maxPortfolioSize;
        limitBreaches[1] = _abs(portfolio.totalDelta) > _abs(limits.maxDelta);
        limitBreaches[2] = _abs(portfolio.totalGamma) > _abs(limits.maxGamma);
        limitBreaches[3] = _abs(portfolio.totalVega) > _abs(limits.maxVega);
        limitBreaches[4] = portfolio.portfolioVaR > limits.maxVaR;
        limitBreaches[5] = portfolio.portfolioRiskScore > 8000;
        
        return (portfolio, positions, limits, limitBreaches);
    }

    // ============ Internal Functions ============
    
    function _calculatePositionRisk(
        bytes32 optionId,
        address user,
        OptionSpec memory spec,
        uint256 notionalValue
    ) internal view returns (PositionRisk memory) {
        uint256 currentPrice = _getCurrentPrice(spec.underlying);
        uint256 timeToExpiry = spec.expiryTime > block.timestamp ? 
            spec.expiryTime - block.timestamp : 0;
        
        uint256 impliedVol = _getImpliedVolatility(spec.underlying);
        uint256 riskFreeRate = _getRiskFreeRate(spec.underlying);
        
        Greeks memory greeks = _calculateGreeks(
            spec.optionType,
            currentPrice,
            spec.strikePrice,
            timeToExpiry,
            impliedVol,
            riskFreeRate,
            spec.contractSize
        );
        
        uint256 riskScore = _calculateRiskScore(spec, currentPrice, timeToExpiry, greeks, notionalValue);
        RiskLevel riskLevel = _determineRiskLevel(riskScore);
        
        return PositionRisk({
            optionId: optionId,
            user: user,
            spec: spec,
            notionalValue: notionalValue,
            currentPrice: currentPrice,
            timeToExpiry: timeToExpiry,
            greeks: greeks,
            impliedVolatility: impliedVol,
            riskScore: riskScore,
            riskLevel: riskLevel,
            lastUpdate: block.timestamp
        });
    }

    function _calculateGreeks(
        OptionType optionType,
        uint256 currentPrice,
        uint256 strikePrice,
        uint256 timeToExpiry,
        uint256 impliedVol,
        uint256 riskFreeRate,
        uint256 contractSize
    ) internal pure returns (Greeks memory) {
        if (timeToExpiry == 0) {
            int256 deltaAtExpiry = 0;
            if (optionType == OptionType.CALL) {
                deltaAtExpiry = currentPrice >= strikePrice ? int256(PRECISION) : int256(0);
            } else {
                deltaAtExpiry = strikePrice >= currentPrice ? -int256(PRECISION) : int256(0);
            }
            
            return Greeks({
                delta: (deltaAtExpiry * int256(contractSize)) / int256(PRECISION),
                gamma: 0,
                theta: 0,
                vega: 0,
                rho: 0
            });
        }
        
        uint256 timeToExpiryYears = (timeToExpiry * PRECISION) / SECONDS_PER_YEAR;
        
        (int256 d1, int256 d2) = _calculateD1D2(
            currentPrice,
            strikePrice,
            riskFreeRate,
            impliedVol,
            timeToExpiryYears
        );
        
        uint256 nd1 = _normalCDF(d1);
        uint256 nd2 = _normalCDF(d2);
        uint256 npd1 = _normalPDF(d1);
        
        int256 optionDelta;
        if (optionType == OptionType.CALL) {
            optionDelta = int256(nd1);
        } else {
            optionDelta = int256(nd1) - int256(PRECISION);
        }
        
        int256 optionGamma = int256((npd1 * PRECISION) / (currentPrice * impliedVol * _sqrt(timeToExpiryYears) / PRECISION));
        
        int256 optionTheta;
        uint256 term1 = (currentPrice * npd1 * impliedVol) / (2 * _sqrt(timeToExpiryYears));
        uint256 term2 = (riskFreeRate * strikePrice * _exp(-int256((riskFreeRate * timeToExpiryYears) / PRECISION))) / PRECISION;
        
        if (optionType == OptionType.CALL) {
            optionTheta = -int256(term1) - int256((term2 * nd2) / PRECISION);
        } else {
            optionTheta = -int256(term1) + int256((term2 * (PRECISION - nd2)) / PRECISION);
        }
        
        optionTheta = (optionTheta * int256(PRECISION)) / int256(365);
        
        int256 optionVega = int256((currentPrice * npd1 * _sqrt(timeToExpiryYears)) / PRECISION);
        
        int256 optionRho;
        uint256 rhoTerm = (strikePrice * timeToExpiryYears * _exp(-int256((riskFreeRate * timeToExpiryYears) / PRECISION))) / (PRECISION * PRECISION);
        
        if (optionType == OptionType.CALL) {
            optionRho = int256((rhoTerm * nd2) / PRECISION);
        } else {
            optionRho = -int256((rhoTerm * (PRECISION - nd2)) / PRECISION);
        }
        
        return Greeks({
            delta: (optionDelta * int256(contractSize)) / int256(PRECISION),
            gamma: (optionGamma * int256(contractSize)) / int256(PRECISION),
            theta: (optionTheta * int256(contractSize)) / int256(PRECISION),
            vega: (optionVega * int256(contractSize)) / int256(PRECISION),
            rho: (optionRho * int256(contractSize)) / int256(PRECISION)
        });
    }

    function _calculateD1D2(
        uint256 currentPrice,
        uint256 strikePrice,
        uint256 riskFreeRate,
        uint256 impliedVol,
        uint256 timeToExpiryYears
    ) internal pure returns (int256 d1, int256 d2) {
        int256 lnSK = _naturalLog((currentPrice * PRECISION) / strikePrice);
        
        uint256 volSquared = (impliedVol * impliedVol) / PRECISION;
        uint256 rPlusHalfVolSquared = riskFreeRate + (volSquared / 2);
        int256 rTerm = int256((rPlusHalfVolSquared * timeToExpiryYears) / PRECISION);
        
        uint256 volSqrtT = (impliedVol * _sqrt(timeToExpiryYears)) / PRECISION;
        
        d1 = (lnSK + rTerm) / int256(volSqrtT);
        d2 = d1 - int256(volSqrtT);
        
        return (d1, d2);
    }

    function _updatePortfolioRisk(address user) internal {
        bytes32[] memory positions = userPositions[user];
        
        int256 totalDelta = 0;
        int256 totalGamma = 0;
        int256 totalTheta = 0;
        int256 totalVega = 0;
        int256 totalRho = 0;
        uint256 totalNotional = 0;
        uint256 totalRiskScore = 0;
        
        for (uint256 i = 0; i < positions.length; i++) {
            PositionRisk memory position = positionRisks[positions[i]];
            if (position.optionId != bytes32(0)) {
                totalDelta += position.greeks.delta;
                totalGamma += position.greeks.gamma;
                totalTheta += position.greeks.theta;
                totalVega += position.greeks.vega;
                totalRho += position.greeks.rho;
                totalNotional += position.notionalValue;
                totalRiskScore += position.riskScore;
            }
        }
        
        uint256 portfolioVaR = _calculatePortfolioVaR(user, totalDelta, totalVega);
        uint256 avgRiskScore = positions.length > 0 ? totalRiskScore / positions.length : 0;
        RiskLevel portfolioRiskLevel = _determineRiskLevel(avgRiskScore);
        
        portfolioRisks[user] = PortfolioRisk({
            user: user,
            totalNotional: totalNotional,
            totalDelta: totalDelta,
            totalGamma: totalGamma,
            totalTheta: totalTheta,
            totalVega: totalVega,
            totalRho: totalRho,
            portfolioVaR: portfolioVaR,
            maxDrawdown: _calculateMaxDrawdown(user),
            sharpeRatio: _calculateSharpeRatio(user),
            portfolioRiskScore: avgRiskScore,
            portfolioRiskLevel: portfolioRiskLevel,
            lastUpdate: block.timestamp
        });
        
        emit PortfolioRiskUpdated(user, portfolioVaR, avgRiskScore, portfolioRiskLevel);
    }

    function _calculateRiskScore(
        OptionSpec memory spec,
        uint256 currentPrice,
        uint256 timeToExpiry,
        Greeks memory greeks,
        uint256 notionalValue
    ) internal view returns (uint256) {
        uint256 timeScore = timeToExpiry < 7 days ? 2000 : 
                           timeToExpiry < 30 days ? 1000 : 500;
        
        uint256 moneyness = currentPrice > spec.strikePrice ? 
            (currentPrice * PRECISION) / spec.strikePrice :
            (spec.strikePrice * PRECISION) / currentPrice;
        
        uint256 moneynessScore = moneyness > 110 * PRECISION / 100 ? 1500 : 
                                moneyness > 105 * PRECISION / 100 ? 1000 : 500;
        
        uint256 impliedVol = _getImpliedVolatility(spec.underlying);
        uint256 volScore = impliedVol > 100 * PRECISION / 100 ? 2000 : 
                          impliedVol > 50 * PRECISION / 100 ? 1000 : 500;
        
        uint256 greeksScore = (_abs(greeks.delta) > 50 * PRECISION / 100 ? 500 : 0) +
                             (_abs(greeks.gamma) > 100 * PRECISION / 100 ? 500 : 0) +
                             (_abs(greeks.vega) > 1000 * PRECISION / 100 ? 500 : 0);
        
        uint256 marketScore = marketConditions.isHighVolatility ? 1000 : 0;
        marketScore += marketConditions.isMarketStress ? 1000 : 0;
        
        uint256 sizeScore = notionalValue > 1000000 * PRECISION ? 1000 : 
                           notionalValue > 100000 * PRECISION ? 500 : 0;
        
        uint256 baseScore = timeScore + moneynessScore + volScore + greeksScore + marketScore + sizeScore;
        
        if (emergencyRiskMode) {
            baseScore = (baseScore * emergencyRiskMultiplier) / 100;
        }
        
        return Math.min(baseScore, 10000);
    }

    function _determineRiskLevel(uint256 riskScore) internal pure returns (RiskLevel) {
        if (riskScore >= 8000) return RiskLevel.CRITICAL;
        if (riskScore >= 6000) return RiskLevel.HIGH;
        if (riskScore >= 3000) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    function _calculatePortfolioVaR(address user, int256 totalDelta, int256 totalVega) internal view returns (uint256) {
        PortfolioRisk memory portfolio = portfolioRisks[user];
        if (portfolio.totalNotional == 0) return 0;
        
        uint256 dailyVol = 2 * PRECISION / 100;
        uint256 volOfVol = 20 * PRECISION / 100;
        
        uint256 deltaVaR = (_abs(totalDelta) * dailyVol) / PRECISION;
        uint256 vegaVaR = (_abs(totalVega) * volOfVol) / PRECISION;
        
        uint256 combinedVaR = _sqrt(deltaVaR * deltaVaR + vegaVaR * vegaVaR + deltaVaR * vegaVaR);
        
        return (combinedVaR * 1645) / 1000;
    }

    function _calculateMaxDrawdown(address user) internal view returns (uint256) {
        PortfolioRisk memory portfolio = portfolioRisks[user];
        
        uint256 thetaLoss = _abs(portfolio.totalTheta);
        uint256 deltaLoss = (_abs(portfolio.totalDelta) * 4 * PRECISION) / 100;
        
        return thetaLoss + deltaLoss;
    }

    function _calculateSharpeRatio(address user) internal pure returns (uint256) {
        user; // Suppress unused parameter warning
        return 150; // Assume 1.5 Sharpe ratio
    }

    function _checkRiskLimits(address user, bytes32 optionId) internal {
        RiskLimits memory limits = _getUserRiskLimits(user);
        PortfolioRisk memory portfolio = portfolioRisks[user];
        PositionRisk memory position = positionRisks[optionId];
        
        if (position.notionalValue > limits.maxPositionSize) {
            emit RiskLimitExceeded(user, "position_size", position.notionalValue, limits.maxPositionSize);
        }
        
        if (portfolio.totalNotional > limits.maxPortfolioSize) {
            emit RiskLimitExceeded(user, "portfolio_size", portfolio.totalNotional, limits.maxPortfolioSize);
        }
        
        if (_abs(portfolio.totalDelta) > _abs(limits.maxDelta)) {
            emit RiskLimitExceeded(user, "delta", _abs(portfolio.totalDelta), _abs(limits.maxDelta));
        }
        
        if (_abs(portfolio.totalGamma) > _abs(limits.maxGamma)) {
            emit RiskLimitExceeded(user, "gamma", _abs(portfolio.totalGamma), _abs(limits.maxGamma));
        }
        
        if (_abs(portfolio.totalVega) > _abs(limits.maxVega)) {
            emit RiskLimitExceeded(user, "vega", _abs(portfolio.totalVega), _abs(limits.maxVega));
        }
        
        if (portfolio.portfolioVaR > limits.maxVaR) {
            emit RiskLimitExceeded(user, "var", portfolio.portfolioVaR, limits.maxVaR);
        }
    }

    function _checkLiquidationTrigger(bytes32 optionId) internal {
        if (!autoLiquidationEnabled) return;
        
        (bool needsLiquidation, string memory reason) = this.checkLiquidation(optionId);
        
        if (needsLiquidation) {
            this.triggerLiquidation(optionId, reason);
        }
    }

    function _executeLiquidation(bytes32 optionId, string memory reason) internal {
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature("liquidatePosition(bytes32)", optionId)
        );
        require(success, "Liquidation execution failed");
        
        PositionRisk memory position = positionRisks[optionId];
        _removeUserPosition(position.user, optionId);
        delete positionRisks[optionId];
        
        _updatePortfolioRisk(position.user);
    }

    function _updatePositionRiskInternal(bytes32 optionId) internal {
        PositionRisk storage position = positionRisks[optionId];
        
        PositionRisk memory updatedRisk = _calculatePositionRisk(
            optionId,
            position.user,
            position.spec,
            position.notionalValue
        );
        
        positionRisks[optionId] = updatedRisk;
        
        if (updatedRisk.riskLevel == RiskLevel.CRITICAL) {
            _checkLiquidationTrigger(optionId);
        }
    }

    function _removeUserPosition(address user, bytes32 optionId) internal {
        bytes32[] storage positions = userPositions[user];
        
        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i] == optionId) {
                positions[i] = positions[positions.length - 1];
                positions.pop();
                break;
            }
        }
    }

    function _getUserRiskLimits(address user) internal view returns (RiskLimits memory) {
        RiskLimits memory userLimits = userRiskLimits[user];
        
        if (!userLimits.isActive) {
            return defaultRiskLimits;
        }
        
        return userLimits;
    }

    function _getAssetExposure(address user, string memory asset) internal view returns (uint256) {
        bytes32[] memory positions = userPositions[user];
        uint256 exposure = 0;
        
        for (uint256 i = 0; i < positions.length; i++) {
            PositionRisk memory position = positionRisks[positions[i]];
            if (keccak256(bytes(position.spec.underlying)) == keccak256(bytes(asset))) {
                exposure += position.notionalValue;
            }
        }
        
        return exposure;
    }

    function _getCurrentPrice(string memory underlying) internal view returns (uint256) {
        (bool success, bytes memory result) = priceOracle.staticcall(
            abi.encodeWithSignature("getPrice(string)", underlying)
        );
        require(success, "Price oracle call failed");
        return abi.decode(result, (uint256));
    }

    function _getImpliedVolatility(string memory asset) internal view returns (uint256) {
        uint256 vol = impliedVolatilities[asset];
        return vol > 0 ? vol : defaultImpliedVolatility;
    }

    function _getRiskFreeRate(string memory asset) internal view returns (uint256) {
        AssetRiskConfig memory config = assetRiskConfigs[asset];
        return config.riskFreeRate > 0 ? config.riskFreeRate : defaultRiskFreeRate;
    }

    function _activateEmergencyRiskMode(string memory reason) internal {
        emergencyRiskMode = true;
        emit EmergencyRiskModeActivated(reason, block.timestamp);
    }

    // ============ Mathematical Helper Functions ============
    
    function _abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function _exp(int256 x) internal pure returns (uint256) {
        if (x == 0) return PRECISION;
        
        bool negative = x < 0;
        uint256 absX = negative ? uint256(-x) : uint256(x);
        
        if (absX > 20 * PRECISION) {
            return negative ? 1 : type(uint256).max / 1e10;
        }
        
        uint256 result = PRECISION;
        uint256 term = PRECISION;
        
        for (uint256 i = 1; i <= 10; i++) {
            term = (term * absX) / (i * PRECISION);
            result += term;
            if (term < PRECISION / 1000) break;
        }
        
        return negative ? (PRECISION * PRECISION) / result : result;
    }

    function _naturalLog(uint256 x) internal pure returns (int256) {
        require(x > 0, "Natural log of zero or negative number");
        
        if (x == PRECISION) return 0;
        
        bool negative = x < PRECISION;
        uint256 ratio = negative ? (PRECISION * PRECISION) / x : x;
        
        int256 y = int256(ratio - PRECISION);
        int256 result = y;
        
        int256 term = y;
        for (uint256 i = 2; i <= 10; i++) {
            term = (term * y) / int256(PRECISION);
            if (i % 2 == 0) {
                result -= term / int256(i);
            } else {
                result += term / int256(i);
            }
        }
        
        return negative ? -result : result;
    }

    function _normalCDF(int256 x) internal pure returns (uint256) {
        bool negative = x < 0;
        uint256 absX = negative ? uint256(-x) : uint256(x);
        
        if (absX > 6 * PRECISION) {
            return negative ? 0 : PRECISION;
        }
        
        uint256 t = (PRECISION * PRECISION) / (PRECISION + (316 * absX) / 1000);
        
        uint256 phi = (398942280401433 * _exp(-int256((absX * absX) / (2 * PRECISION)))) / (SQRT_2PI);
        
        uint256 result = phi * t * (
            31938153 + t * (356563782 + t * (1781477937 + t * (1821255978 + t * 1330274429))) 
        ) / (PRECISION ** 4);
        
        result = PRECISION - result;
        
        return negative ? PRECISION - result : result;
    }

    function _normalPDF(int256 x) internal pure returns (uint256) {
        uint256 absX = x >= 0 ? uint256(x) : uint256(-x);
        
        uint256 exponent = (absX * absX) / (2 * PRECISION);
        uint256 expValue = _exp(-int256(exponent));
        
        return (expValue * PRECISION) / SQRT_2PI;
    }

    // ============ Initialization Functions ============
    
    function _initializeDefaultRiskLimits() internal {
        defaultRiskLimits = RiskLimits({
            maxPositionSize: 1000000 * PRECISION,
            maxPortfolioSize: 10000000 * PRECISION,
            maxDelta: int256(1000 * PRECISION),
            maxGamma: int256(500 * PRECISION),
            maxVega: int256(2000 * PRECISION),
            maxVaR: 500000 * PRECISION,
            concentrationLimit: 2000,
            isActive: true
        });
    }

    function _initializeDefaultAssetConfigs() internal {
        assetRiskConfigs["ETH"] = AssetRiskConfig({
            baseVolatility: 80 * PRECISION / 100,
            riskFreeRate: 5 * PRECISION / 100,
            maxLeverage: 10 * PRECISION,
            liquidationThreshold: 120 * PRECISION / 100,
            correlationFactor: 70 * PRECISION / 100,
            requiresMargin: true,
            marginMultiplier: 150 * PRECISION / 100
        });
        
        assetRiskConfigs["BTC"] = AssetRiskConfig({
            baseVolatility: 75 * PRECISION / 100,
            riskFreeRate: 5 * PRECISION / 100,
            maxLeverage: 10 * PRECISION,
            liquidationThreshold: 120 * PRECISION / 100,
            correlationFactor: 60 * PRECISION / 100,
            requiresMargin: true,
            marginMultiplier: 150 * PRECISION / 100
        });
        
        assetRiskConfigs["AAPL"] = AssetRiskConfig({
            baseVolatility: 30 * PRECISION / 100,
            riskFreeRate: 5 * PRECISION / 100,
            maxLeverage: 5 * PRECISION,
            liquidationThreshold: 130 * PRECISION / 100,
            correlationFactor: 80 * PRECISION / 100,
            requiresMargin: true,
            marginMultiplier: 200 * PRECISION / 100
        });
    }

    // ============ Admin Functions ============
    
    function setAssetRiskConfig(string calldata asset, AssetRiskConfig calldata config) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(config.baseVolatility > 0 && config.baseVolatility <= 500 * PRECISION / 100, "Invalid volatility");
        require(config.maxLeverage > 0 && config.maxLeverage <= 100 * PRECISION, "Invalid leverage");
        require(config.liquidationThreshold >= 100 * PRECISION / 100, "Invalid threshold");
        
        assetRiskConfigs[asset] = config;
    }

    function setDefaultRiskLimits(RiskLimits calldata limits) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(limits.maxPositionSize > 0, "Invalid position size");
        require(limits.maxPortfolioSize >= limits.maxPositionSize, "Invalid portfolio size");
        require(limits.concentrationLimit <= 10000, "Invalid concentration limit");
        
        defaultRiskLimits = limits;
    }

    function setProtocolAddresses(address _optionsCalculator) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        optionsCalculator = _optionsCalculator;
    }

    function setRiskParameters(
        uint256 _riskUpdateInterval,
        bool _autoLiquidationEnabled,
        uint256 _liquidationBuffer
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_riskUpdateInterval >= 60, "Update interval too short");
        require(_liquidationBuffer <= 2000, "Buffer too high");
        
        riskUpdateInterval = _riskUpdateInterval;
        autoLiquidationEnabled = _autoLiquidationEnabled;
        liquidationBuffer = _liquidationBuffer;
    }

    function pauseAssetRisk(string calldata asset, bool paused) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        assetRiskPaused[asset] = paused;
    }

    /*function activateEmergencyRiskMode(string calldata reason) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        _activateEmergencyRiskMode(reason);
    }

    function deactivateEmergencyRiskMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyRiskMode = false;
    }
*/
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}