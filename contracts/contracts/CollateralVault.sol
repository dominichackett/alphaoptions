// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title CollateralVault
 * @dev Advanced collateral management system for multi-asset options
 * Handles margin requirements, liquidations, cross-margining, and yield optimization
 */
contract CollateralVault is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant OPTIONS_PROTOCOL_ROLE = keccak256("OPTIONS_PROTOCOL_ROLE");
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_COLLATERAL_RATIO = 500; // 500% max
    uint256 public constant MIN_COLLATERAL_RATIO = 110; // 110% min
    uint256 public constant LIQUIDATION_PENALTY = 500; // 5% liquidation penalty
    uint256 public constant MAX_LIQUIDATION_PENALTY = 2000; // 20% max penalty

    // ============ Enums ============
    
    enum CollateralStatus { ACTIVE, LIQUIDATING, LIQUIDATED, RELEASED }
    enum MarginType { ISOLATED, CROSS, PORTFOLIO }

    // ============ Structs ============
    
    struct CollateralPosition {
        bytes32 optionId;           // Associated option ID
        address owner;              // Position owner
        address token;              // Collateral token
        uint256 amount;             // Collateral amount
        uint256 requiredAmount;     // Required collateral
        uint256 lockedAt;          // Lock timestamp
        CollateralStatus status;    // Position status
        MarginType marginType;      // Margin calculation type
        uint256 liquidationPrice;   // Price trigger for liquidation
        bool isYieldEnabled;        // Yield optimization enabled
    }

    struct UserAccount {
        mapping(address => uint256) tokenBalances;  // Available balances
        mapping(bytes32 => CollateralPosition) positions; // Collateral positions
        bytes32[] activePositions;  // Array of active position IDs
        uint256 totalCollateralValue; // USD value of total collateral
        uint256 totalRequiredMargin;   // USD value of required margin
        bool crossMarginEnabled;    // Cross-margin mode
        uint256 lastUpdateTime;     // Last account update
    }

    struct TokenConfig {
        bool isAccepted;            // Token accepted as collateral
        uint256 collateralFactor;   // Loan-to-value ratio (basis points)
        uint256 liquidationThreshold; // Liquidation trigger (basis points)
        address priceOracle;        // Price oracle for this token
        uint256 maxExposure;        // Maximum exposure limit
        uint256 currentExposure;    // Current total exposure
        bool isStable;              // Is stablecoin
        uint256 yieldRate;          // Annual yield rate (basis points)
    }

    struct LiquidationInfo {
        bytes32 positionId;
        address liquidator;
        uint256 liquidatedAmount;
        uint256 penalty;
        uint256 timestamp;
        uint256 triggerPrice;
    }

    // ============ State Variables ============
    
    mapping(address => UserAccount) private userAccounts;
    mapping(bytes32 => CollateralPosition) public positions;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(bytes32 => LiquidationInfo) public liquidations;
    
    address[] public acceptedTokens;
    bytes32[] public allPositions;
    
    // Protocol addresses
    address public optionsProtocol;
    address public riskManager;
    address public priceOracle;
    address public yieldOptimizer;
    address public liquidationEngine;
    
    // Protocol parameters
    uint256 public defaultCollateralRatio = 150; // 150%
    uint256 public emergencyCollateralRatio = 120; // 120%
    uint256 public liquidationIncentive = 500; // 5% incentive for liquidators
    uint256 public crossMarginDiscount = 200; // 2% discount for cross-margin
    
    // Yield and fee parameters
    uint256 public protocolFeeRate = 100; // 1% protocol fee on yield
    address public feeRecipient;
    uint256 public totalYieldGenerated;
    uint256 public totalFeesCollected;
    
    // Emergency and circuit breaker
    bool public emergencyMode;
    uint256 public emergencyTimestamp;
    mapping(address => bool) public emergencyWithdrawEnabled;

    // ============ Events ============
    
    event CollateralDeposited(
        address indexed user,
        bytes32 indexed optionId,
        address indexed token,
        uint256 amount,
        MarginType marginType
    );

    event CollateralWithdrawn(
        address indexed user,
        bytes32 indexed optionId,
        address indexed token,
        uint256 amount
    );

    event CollateralLocked(
        bytes32 indexed optionId,
        address indexed owner,
        address indexed token,
        uint256 amount,
        uint256 requiredAmount
    );

    event CollateralReleased(
        bytes32 indexed optionId,
        address indexed owner,
        uint256 releasedAmount
    );

    event LiquidationTriggered(
        bytes32 indexed positionId,
        address indexed owner,
        address indexed liquidator,
        uint256 liquidatedAmount,
        uint256 penalty
    );

    event MarginCall(
        address indexed user,
        bytes32 indexed optionId,
        uint256 currentRatio,
        uint256 requiredRatio,
        uint256 additionalRequired
    );

    event YieldHarvested(
        address indexed user,
        address indexed token,
        uint256 yieldAmount,
        uint256 protocolFee
    );

    event CrossMarginToggled(
        address indexed user,
        bool enabled
    );

    // ============ Modifiers ============
    
    modifier onlyOptionsProtocol() {
        require(hasRole(OPTIONS_PROTOCOL_ROLE, msg.sender), "Only options protocol");
        _;
    }

    modifier onlyLiquidator() {
        require(hasRole(LIQUIDATOR_ROLE, msg.sender), "Only liquidator");
        _;
    }

    modifier validToken(address token) {
        require(tokenConfigs[token].isAccepted, "Token not accepted");
        _;
    }

    modifier validPosition(bytes32 positionId) {
        require(positions[positionId].owner != address(0), "Position does not exist");
        _;
    }

    modifier notEmergency() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _admin,
        address _optionsProtocol,
        address _feeRecipient
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(OPTIONS_PROTOCOL_ROLE, _optionsProtocol);
        
        optionsProtocol = _optionsProtocol;
        feeRecipient = _feeRecipient;
    }

    // ============ Core Collateral Functions ============
    
    /**
     * @dev Locks collateral for an option position
     * @param optionId Unique option identifier
     * @param owner Position owner
     * @param token Collateral token
     * @param amount Collateral amount
     * @param requiredAmount Required collateral amount
     * @param marginType Type of margin calculation
     */
    function lockCollateral(
        bytes32 optionId,
        address owner,
        address token,
        uint256 amount,
        uint256 requiredAmount,
        MarginType marginType
    ) external onlyOptionsProtocol nonReentrant validToken(token) notEmergency {
        require(amount >= requiredAmount, "Insufficient collateral");
        require(positions[optionId].owner == address(0), "Position already exists");
        
        // Check token exposure limits
        TokenConfig storage config = tokenConfigs[token];
        require(config.currentExposure + amount <= config.maxExposure, "Token exposure limit exceeded");
        
        // Create collateral position
        positions[optionId] = CollateralPosition({
            optionId: optionId,
            owner: owner,
            token: token,
            amount: amount,
            requiredAmount: requiredAmount,
            lockedAt: block.timestamp,
            status: CollateralStatus.ACTIVE,
            marginType: marginType,
            liquidationPrice: _calculateLiquidationPrice(token, amount, requiredAmount),
            isYieldEnabled: true
        });
        
        // Update user account
        UserAccount storage account = userAccounts[owner];
        account.positions[optionId] = positions[optionId];
        account.activePositions.push(optionId);
        
        // Update exposure and tracking
        config.currentExposure += amount;
        allPositions.push(optionId);
        
        // Update account totals if cross-margin enabled
        if (account.crossMarginEnabled) {
            _updateAccountTotals(owner);
        }
        
        emit CollateralLocked(optionId, owner, token, amount, requiredAmount);
    }

    /**
     * @dev Releases collateral when option expires or is closed
     * @param optionId Option identifier
     */
    function releaseCollateral(bytes32 optionId) 
        external 
        onlyOptionsProtocol 
        nonReentrant 
        validPosition(optionId) 
    {
        CollateralPosition storage position = positions[optionId];
        require(position.status == CollateralStatus.ACTIVE, "Position not active");
        
        address owner = position.owner;
        address token = position.token;
        uint256 amount = position.amount;
        
        // Mark as released
        position.status = CollateralStatus.RELEASED;
        
        // Update token exposure
        tokenConfigs[token].currentExposure -= amount;
        
        // Remove from user's active positions
        _removeActivePosition(owner, optionId);
        
        // Harvest any yield before release
        if (position.isYieldEnabled) {
            _harvestYield(owner, token, amount);
        }
        
        // Transfer collateral back to options protocol for distribution
        IERC20(token).safeTransfer(optionsProtocol, amount);
        
        // Update account totals if cross-margin
        UserAccount storage account = userAccounts[owner];
        if (account.crossMarginEnabled) {
            _updateAccountTotals(owner);
        }
        
        emit CollateralReleased(optionId, owner, amount);
    }

    /**
     * @dev Partially releases collateral (for partial exercise scenarios)
     * @param optionId Option identifier
     * @param releaseAmount Amount to release
     */
    function partialReleaseCollateral(bytes32 optionId, uint256 releaseAmount)
        external
        onlyOptionsProtocol
        nonReentrant
        validPosition(optionId)
    {
        CollateralPosition storage position = positions[optionId];
        require(position.status == CollateralStatus.ACTIVE, "Position not active");
        require(releaseAmount <= position.amount, "Release amount too high");
        
        // Calculate new required amount proportionally
        uint256 newRequiredAmount = (position.requiredAmount * (position.amount - releaseAmount)) / position.amount;
        
        // Update position
        position.amount -= releaseAmount;
        position.requiredAmount = newRequiredAmount;
        position.liquidationPrice = _calculateLiquidationPrice(position.token, position.amount, newRequiredAmount);
        
        // Update token exposure
        tokenConfigs[position.token].currentExposure -= releaseAmount;
        
        // Transfer released collateral
        IERC20(position.token).safeTransfer(optionsProtocol, releaseAmount);
        
        emit CollateralReleased(optionId, position.owner, releaseAmount);
    }

    // ============ Margin and Risk Management ============
    
    /**
     * @dev Checks if position needs liquidation
     * @param optionId Position to check
     * @return needsLiquidation Whether liquidation is needed
     * @return currentRatio Current collateral ratio
     */
    function checkLiquidation(bytes32 optionId) 
        external 
        view 
        validPosition(optionId) 
        returns (bool needsLiquidation, uint256 currentRatio) 
    {
        CollateralPosition memory position = positions[optionId];
        
        if (position.status != CollateralStatus.ACTIVE) {
            return (false, 0);
        }
        
        uint256 collateralValue = _getTokenValue(position.token, position.amount);
        uint256 requiredValue = _getTokenValue(position.token, position.requiredAmount);
        
        if (requiredValue == 0) return (false, 0);
        
        currentRatio = (collateralValue * 100) / requiredValue;
        TokenConfig memory config = tokenConfigs[position.token];
        
        needsLiquidation = currentRatio < config.liquidationThreshold;
        
        return (needsLiquidation, currentRatio);
    }

    /**
     * @dev Liquidates an undercollateralized position
     * @param optionId Position to liquidate
     */
    function liquidatePosition(bytes32 optionId)
        external
        onlyLiquidator
        nonReentrant
        validPosition(optionId)
        whenNotPaused
    {
        (bool needsLiquidation, uint256 currentRatio) = this.checkLiquidation(optionId);
        require(needsLiquidation, "Position adequately collateralized");
        
        CollateralPosition storage position = positions[optionId];
        position.status = CollateralStatus.LIQUIDATING;
        
        uint256 liquidationAmount = position.amount;
        uint256 penalty = (liquidationAmount * LIQUIDATION_PENALTY) / 10000;
        uint256 liquidatorReward = (liquidationAmount * liquidationIncentive) / 10000;
        
        // Record liquidation
        liquidations[optionId] = LiquidationInfo({
            positionId: optionId,
            liquidator: msg.sender,
            liquidatedAmount: liquidationAmount,
            penalty: penalty,
            timestamp: block.timestamp,
            triggerPrice: _getCurrentPrice(position.token)
        });
        
        // Update position status
        position.status = CollateralStatus.LIQUIDATED;
        
        // Update token exposure
        tokenConfigs[position.token].currentExposure -= liquidationAmount;
        
        // Distribute liquidated assets
        IERC20(position.token).safeTransfer(msg.sender, liquidatorReward);
        IERC20(position.token).safeTransfer(feeRecipient, penalty);
        
        uint256 remainingAmount = liquidationAmount - liquidatorReward - penalty;
        if (remainingAmount > 0) {
            IERC20(position.token).safeTransfer(optionsProtocol, remainingAmount);
        }
        
        // Remove from active positions
        _removeActivePosition(position.owner, optionId);
        
        emit LiquidationTriggered(optionId, position.owner, msg.sender, liquidationAmount, penalty);
    }

    /**
     * @dev Issues margin call for undercollateralized position
     * @param optionId Position requiring additional margin
     */
    function issueMarginCall(bytes32 optionId) external validPosition(optionId) {
        CollateralPosition memory position = positions[optionId];
        (bool needsLiquidation, uint256 currentRatio) = this.checkLiquidation(optionId);
        
        TokenConfig memory config = tokenConfigs[position.token];
        bool marginCallNeeded = currentRatio < config.collateralFactor && currentRatio >= config.liquidationThreshold;
        
        require(marginCallNeeded, "No margin call needed");
        
        uint256 additionalRequired = _calculateAdditionalMargin(optionId);
        
        emit MarginCall(
            position.owner,
            optionId,
            currentRatio,
            config.collateralFactor,
            additionalRequired
        );
    }

    // ============ Cross-Margin Functions ============
    
    /**
     * @dev Enables/disables cross-margin for user
     * @param enabled Whether to enable cross-margin
     */
    function setCrossMargin(bool enabled) external nonReentrant {
        UserAccount storage account = userAccounts[msg.sender];
        account.crossMarginEnabled = enabled;
        
        if (enabled) {
            _updateAccountTotals(msg.sender);
        }
        
        emit CrossMarginToggled(msg.sender, enabled);
    }

    /**
     * @dev Gets user's total margin status across all positions
     * @param user User address
     * @return totalCollateral Total collateral value in USD
     * @return totalRequired Total required margin in USD
     * @return healthFactor Overall health factor
     */
    function getAccountMarginStatus(address user) 
        external 
        view 
        returns (uint256 totalCollateral, uint256 totalRequired, uint256 healthFactor) 
    {
        UserAccount storage account = userAccounts[user];
        
        if (!account.crossMarginEnabled) {
            return (0, 0, 0);
        }
        
        totalCollateral = account.totalCollateralValue;
        totalRequired = account.totalRequiredMargin;
        
        healthFactor = totalRequired > 0 ? (totalCollateral * PRECISION) / totalRequired : type(uint256).max;
        
        return (totalCollateral, totalRequired, healthFactor);
    }

    // ============ Yield Optimization ============
    
    /**
     * @dev Harvests yield for user's collateral positions
     * @param user User address
     * @param token Token to harvest yield for
     */
    function harvestYield(address user, address token) external nonReentrant validToken(token) {
        require(yieldOptimizer != address(0), "Yield optimizer not set");
        
        uint256 userBalance = _getUserTokenBalance(user, token);
        require(userBalance > 0, "No balance to harvest");
        
        _harvestYield(user, token, userBalance);
    }

    /**
     * @dev Enables/disables yield optimization for a position
     * @param optionId Position ID
     * @param enabled Whether to enable yield
     */
    function setYieldOptimization(bytes32 optionId, bool enabled) 
        external 
        validPosition(optionId) 
    {
        CollateralPosition storage position = positions[optionId];
        require(position.owner == msg.sender, "Not position owner");
        
        position.isYieldEnabled = enabled;
    }

    // ============ View Functions ============
    
    /**
     * @dev Gets user's collateral positions
     * @param user User address
     * @return activePositions Array of active position IDs
     */
    function getUserPositions(address user) external view returns (bytes32[] memory) {
        return userAccounts[user].activePositions;
    }

    /**
     * @dev Gets detailed position information
     * @param optionId Position ID
     * @return position Full position details
     */
    function getPosition(bytes32 optionId) external view returns (CollateralPosition memory) {
        return positions[optionId];
    }

    /**
     * @dev Gets token configuration
     * @param token Token address
     * @return config Token configuration
     */
    function getTokenConfig(address token) external view returns (TokenConfig memory) {
        return tokenConfigs[token];
    }

    /**
     * @dev Gets list of accepted collateral tokens
     * @return tokens Array of accepted token addresses
     */
    function getAcceptedTokens() external view returns (address[] memory) {
        return acceptedTokens;
    }

    /**
     * @dev Calculates health factor for a position
     * @param optionId Position ID
     * @return healthFactor Position health factor (1e18 = 100%)
     */
    function getPositionHealthFactor(bytes32 optionId) external view validPosition(optionId) returns (uint256) {
        CollateralPosition memory position = positions[optionId];
        
        uint256 collateralValue = _getTokenValue(position.token, position.amount);
        uint256 requiredValue = _getTokenValue(position.token, position.requiredAmount);
        
        if (requiredValue == 0) return type(uint256).max;
        
        return (collateralValue * PRECISION) / requiredValue;
    }

    // ============ Internal Functions ============
    
    function _updateAccountTotals(address user) internal {
        UserAccount storage account = userAccounts[user];
        
        uint256 totalCollateral = 0;
        uint256 totalRequired = 0;
        
        for (uint256 i = 0; i < account.activePositions.length; i++) {
            bytes32 positionId = account.activePositions[i];
            CollateralPosition memory position = positions[positionId];
            
            if (position.status == CollateralStatus.ACTIVE) {
                totalCollateral += _getTokenValue(position.token, position.amount);
                totalRequired += _getTokenValue(position.token, position.requiredAmount);
            }
        }
        
        account.totalCollateralValue = totalCollateral;
        account.totalRequiredMargin = totalRequired;
        account.lastUpdateTime = block.timestamp;
    }

    function _removeActivePosition(address user, bytes32 optionId) internal {
        UserAccount storage account = userAccounts[user];
        bytes32[] storage activePositions = account.activePositions;
        
        for (uint256 i = 0; i < activePositions.length; i++) {
            if (activePositions[i] == optionId) {
                activePositions[i] = activePositions[activePositions.length - 1];
                activePositions.pop();
                break;
            }
        }
    }

    function _calculateLiquidationPrice(address token, uint256 amount, uint256 requiredAmount) internal view returns (uint256) {
        TokenConfig memory config = tokenConfigs[token];
        uint256 currentPrice = _getCurrentPrice(token);
        
        // Calculate price at which position becomes liquidatable
        return (currentPrice * config.liquidationThreshold * requiredAmount) / (amount * 100);
    }

    function _calculateAdditionalMargin(bytes32 optionId) internal view returns (uint256) {
        CollateralPosition memory position = positions[optionId];
        TokenConfig memory config = tokenConfigs[position.token];
        
        uint256 currentValue = _getTokenValue(position.token, position.amount);
        uint256 requiredValue = (position.requiredAmount * config.collateralFactor) / 100;
        
        if (currentValue >= requiredValue) return 0;
        
        return (requiredValue - currentValue);
    }

    function _harvestYield(address user, address token, uint256 amount) internal {
        if (yieldOptimizer == address(0)) return;
        
        TokenConfig memory config = tokenConfigs[token];
        if (config.yieldRate == 0) return;
        
        // Calculate yield (simplified - would integrate with actual yield protocols)
        uint256 yieldAmount = (amount * config.yieldRate * (block.timestamp - userAccounts[user].lastUpdateTime)) / (365 days * 10000);
        
        if (yieldAmount > 0) {
            uint256 protocolFee = (yieldAmount * protocolFeeRate) / 10000;
            uint256 userYield = yieldAmount - protocolFee;
            
            // Update tracking
            totalYieldGenerated += yieldAmount;
            totalFeesCollected += protocolFee;
            
            emit YieldHarvested(user, token, userYield, protocolFee);
        }
    }

    function _getTokenValue(address token, uint256 amount) internal view returns (uint256) {
        uint256 price = _getCurrentPrice(token);
        return (price * amount) / PRECISION;
    }

    function _getCurrentPrice(address token) internal view returns (uint256) {
        if (priceOracle == address(0)) return PRECISION; // Fallback to 1:1
        
        (bool success, bytes memory result) = priceOracle.staticcall(
            abi.encodeWithSignature("getTokenPrice(address)", token)
        );
        
        if (success && result.length > 0) {
            return abi.decode(result, (uint256));
        }
        
        return PRECISION; // Fallback
    }

    function _getUserTokenBalance(address user, address token) internal view returns (uint256) {
        uint256 balance = 0;
        UserAccount storage account = userAccounts[user];
        
        for (uint256 i = 0; i < account.activePositions.length; i++) {
            CollateralPosition memory position = positions[account.activePositions[i]];
            if (position.token == token && position.status == CollateralStatus.ACTIVE) {
                balance += position.amount;
            }
        }
        
        return balance;
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Adds or updates token configuration
     * @param token Token address
     * @param isAccepted Whether token is accepted as collateral
     * @param collateralFactor Collateral factor (basis points)
     * @param liquidationThreshold Liquidation threshold (basis points)
     * @param maxExposure Maximum exposure limit
     * @param isStable Whether token is a stablecoin
     * @param yieldRate Annual yield rate (basis points)
     */
    function setTokenConfig(
        address token,
        bool isAccepted,
        uint256 collateralFactor,
        uint256 liquidationThreshold,
        uint256 maxExposure,
        bool isStable,
        uint256 yieldRate
    ) external onlyRole(OPERATOR_ROLE) {
        require(collateralFactor <= MAX_COLLATERAL_RATIO * 100, "Collateral factor too high");
        require(liquidationThreshold >= MIN_COLLATERAL_RATIO * 100, "Liquidation threshold too low");
        require(liquidationThreshold < collateralFactor, "Invalid threshold");
        
        TokenConfig storage config = tokenConfigs[token];
        bool wasAccepted = config.isAccepted;
        
        config.isAccepted = isAccepted;
        config.collateralFactor = collateralFactor;
        config.liquidationThreshold = liquidationThreshold;
        config.maxExposure = maxExposure;
        config.isStable = isStable;
        config.yieldRate = yieldRate;
        
        // Add to accepted tokens array if new
        if (isAccepted && !wasAccepted) {
            acceptedTokens.push(token);
        }
        
        // Remove from accepted tokens if no longer accepted
        if (!isAccepted && wasAccepted) {
            for (uint256 i = 0; i < acceptedTokens.length; i++) {
                if (acceptedTokens[i] == token) {
                    acceptedTokens[i] = acceptedTokens[acceptedTokens.length - 1];
                    acceptedTokens.pop();
                    break;
                }
            }
        }
    }

    function setProtocolAddresses(
        address _riskManager,
        address _priceOracle,
        address _yieldOptimizer,
        address _liquidationEngine
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        riskManager = _riskManager;
        priceOracle = _priceOracle;
        yieldOptimizer = _yieldOptimizer;
        liquidationEngine = _liquidationEngine;
    }

    function setProtocolParameters(
        uint256 _defaultCollateralRatio,
        uint256 _emergencyCollateralRatio,
        uint256 _liquidationIncentive,
        uint256 _crossMarginDiscount,
        uint256 _protocolFeeRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_defaultCollateralRatio >= MIN_COLLATERAL_RATIO, "Ratio too low");
        require(_defaultCollateralRatio <= MAX_COLLATERAL_RATIO, "Ratio too high");
        require(_liquidationIncentive <= MAX_LIQUIDATION_PENALTY, "Incentive too high");
        require(_protocolFeeRate <= 1000, "Fee too high"); // Max 10%
        
        defaultCollateralRatio = _defaultCollateralRatio;
        emergencyCollateralRatio = _emergencyCollateralRatio;
        liquidationIncentive = _liquidationIncentive;
        crossMarginDiscount = _crossMarginDiscount;
        protocolFeeRate = _protocolFeeRate;
    }

    // ============ Emergency Functions ============
    
    function activateEmergencyMode() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyMode = true;
        emergencyTimestamp = block.timestamp;
        _pause();
    }

    function deactivateEmergencyMode() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyMode = false;
        _unpause();
    }

    function emergencyWithdraw(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenPaused 
    {
        require(emergencyMode, "Not in emergency mode");
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}