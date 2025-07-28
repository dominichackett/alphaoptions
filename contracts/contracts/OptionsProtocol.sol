// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title OptionsProtocol
 * @dev Core options protocol integrating with 1inch Limit Order Protocol
 * Enables multi-asset options trading (crypto, forex, stocks) with gas-optimized execution
 */
contract OptionsProtocol is ReentrancyGuard, AccessControl, Pausable, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    
    // EIP-712 Type Hashes
    bytes32 private constant OPTION_ORDER_TYPEHASH = keccak256(
        "OptionOrder(address maker,address taker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 expiration,bytes predicate,bytes makerAssetData,bytes takerAssetData,bytes interaction)"
    );

    // ============ Enums ============
    
    enum OptionType { CALL, PUT }
    enum OptionStyle { EUROPEAN, AMERICAN }
    enum AssetType { CRYPTO, FOREX, STOCK }

    // ============ Structs ============
    
    struct OptionOrder {
        address maker;           // Option seller
        address taker;          // Option buyer (address(0) for open order)
        address makerAsset;     // Collateral token
        address takerAsset;     // Premium token
        uint256 makerAmount;    // Collateral amount
        uint256 takerAmount;    // Premium amount
        uint256 salt;           // Unique order identifier
        uint256 expiration;     // Order expiration timestamp
        bytes predicate;        // Custom conditions
        bytes makerAssetData;   // Option specifications
        bytes takerAssetData;   // Additional data
        bytes interaction;      // Post-interaction calls
    }

    struct OptionSpec {
        AssetType assetType;    // CRYPTO, FOREX, STOCK
        string underlying;      // Asset symbol (ETH, EUR/USD, AAPL)
        OptionType optionType;  // CALL or PUT
        OptionStyle style;      // EUROPEAN or AMERICAN
        uint256 strikePrice;    // Strike price (scaled by 1e18)
        uint256 expiryTime;     // Option expiry timestamp
        uint256 contractSize;   // Number of units (for stocks: shares/100)
        address oracle;         // Price oracle address
    }

    struct OptionPosition {
        bytes32 optionId;       // Unique option identifier
        address holder;         // Current option holder
        address writer;         // Option writer (seller)
        OptionSpec spec;        // Option specifications
        uint256 premium;        // Premium paid
        uint256 collateral;     // Collateral locked
        address collateralToken; // Collateral token address
        bool isExercised;       // Exercise status
        bool isExpired;         // Expiry status
        uint256 createdAt;      // Creation timestamp
    }

    // ============ State Variables ============
    
    mapping(bytes32 => uint256) public cancelledOrFilled;
    mapping(bytes32 => OptionPosition) public options;
    mapping(address => bytes32[]) public userOptions;
    mapping(string => address) public assetOracles;
    
    // Contract dependencies
    address public collateralVault;
    address public settlementEngine;
    address public riskManager;
    address public optionsCalculator;
    
    // Protocol parameters
    uint256 public maxOrderDuration = 30 days;
    uint256 public minCollateralRatio = 120; // 120%
    uint256 public protocolFee = 50; // 0.5% (50/10000)
    address public feeRecipient;
    
    uint256 private _optionCounter;

    // ============ Events ============
    
    event OptionCreated(
        bytes32 indexed optionId,
        address indexed maker,
        address indexed taker,
        OptionSpec spec,
        uint256 premium,
        uint256 collateral
    );

    event OptionFilled(
        bytes32 indexed orderHash,
        bytes32 indexed optionId,
        address indexed taker,
        uint256 filledAmount
    );

    event OptionExercised(
        bytes32 indexed optionId,
        address indexed holder,
        uint256 payout,
        uint256 timestamp
    );

    event OptionExpired(
        bytes32 indexed optionId,
        address indexed writer,
        uint256 collateralReleased
    );

    event OrderCancelled(
        bytes32 indexed orderHash,
        address indexed maker
    );

    // ============ Modifiers ============
    
    modifier onlyValidOption(bytes32 optionId) {
        require(options[optionId].holder != address(0), "Option does not exist");
        _;
    }

    modifier notExpired(bytes32 optionId) {
        require(block.timestamp < options[optionId].spec.expiryTime, "Option expired");
        _;
    }

    modifier onlyHolder(bytes32 optionId) {
        require(options[optionId].holder == msg.sender, "Not option holder");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _admin,
        address _feeRecipient,
        string memory _name,
        string memory _version
    ) EIP712(_name, _version) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        feeRecipient = _feeRecipient;
        _optionCounter = 1;
    }

    // ============ Core Functions ============
    
    /**
     * @dev Creates and fills an option order
     * @param order The option order struct
     * @param signature Maker's signature
     * @param makerAssetData Encoded option specifications
     * @param interaction Optional interaction data
     */
    function fillOptionOrder(
        OptionOrder calldata order,
        bytes calldata signature,
        bytes calldata makerAssetData,
        bytes calldata interaction
    ) external nonReentrant whenNotPaused returns (bytes32 optionId) {
        // Validate order
        bytes32 orderHash = _getOrderHash(order);
        require(_isValidSignature(order.maker, orderHash, signature), "Invalid signature");
        require(block.timestamp <= order.expiration, "Order expired");
        require(cancelledOrFilled[orderHash] == 0, "Order already filled or cancelled");
        
        // Decode option specifications
        OptionSpec memory spec = abi.decode(makerAssetData, (OptionSpec));
        require(_isValidOptionSpec(spec), "Invalid option specification");
        
        // Generate unique option ID
        optionId = keccak256(abi.encodePacked(
            orderHash,
            block.timestamp,
            _optionCounter++
        ));
        
        // Determine taker (buyer)
        address taker = order.taker == address(0) ? msg.sender : order.taker;
        require(taker == msg.sender, "Invalid taker");
        
        // Calculate required collateral
        uint256 requiredCollateral = _calculateRequiredCollateral(spec, order.makerAmount);
        require(order.makerAmount >= requiredCollateral, "Insufficient collateral");
        
        // Transfer premium from taker to maker
        uint256 fee = (order.takerAmount * protocolFee) / 10000;
        uint256 netPremium = order.takerAmount - fee;
        
        IERC20(order.takerAsset).safeTransferFrom(taker, order.maker, netPremium);
        if (fee > 0) {
            IERC20(order.takerAsset).safeTransferFrom(taker, feeRecipient, fee);
        }
        
        // Lock collateral from maker
        IERC20(order.makerAsset).safeTransferFrom(order.maker, collateralVault, order.makerAmount);
        
        // Create option position
        options[optionId] = OptionPosition({
            optionId: optionId,
            holder: taker,
            writer: order.maker,
            spec: spec,
            premium: order.takerAmount,
            collateral: order.makerAmount,
            collateralToken: order.makerAsset,
            isExercised: false,
            isExpired: false,
            createdAt: block.timestamp
        });
        
        // Update tracking
        userOptions[taker].push(optionId);
        userOptions[order.maker].push(optionId);
        cancelledOrFilled[orderHash] = order.takerAmount;
        
        // Execute interaction if provided
        if (interaction.length > 0) {
            _executeInteraction(interaction, optionId);
        }
        
        emit OptionCreated(optionId, order.maker, taker, spec, order.takerAmount, order.makerAmount);
        emit OptionFilled(orderHash, optionId, taker, order.takerAmount);
        
        return optionId;
    }

    /**
     * @dev Exercises an option (American style can be called anytime, European only at expiry)
     * @param optionId The option to exercise
     */
    function exerciseOption(bytes32 optionId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidOption(optionId)
        onlyHolder(optionId)
        notExpired(optionId)
    {
        OptionPosition storage position = options[optionId];
        require(!position.isExercised, "Already exercised");
        
        // Check if option can be exercised based on style
        if (position.spec.style == OptionStyle.EUROPEAN) {
            require(
                block.timestamp >= position.spec.expiryTime - 1 hours,
                "European option can only be exercised near expiry"
            );
        }
        
        // Get current price and calculate payout
        uint256 currentPrice = _getCurrentPrice(position.spec.underlying, position.spec.oracle);
        uint256 payout = _calculatePayout(position.spec, currentPrice);
        
        require(payout > 0, "Option is out of the money");
        
        // Mark as exercised
        position.isExercised = true;
        
        // Execute settlement through settlement engine
        _executeSettlement(optionId, payout, currentPrice);
        
        emit OptionExercised(optionId, position.holder, payout, block.timestamp);
    }

    /**
     * @dev Cancels an unfilled order
     * @param orderHash Hash of the order to cancel
     */
    function cancelOrder(bytes32 orderHash) external {
        require(cancelledOrFilled[orderHash] == 0, "Order already filled or cancelled");
        
        // Mark as cancelled (set to max value to distinguish from filled)
        cancelledOrFilled[orderHash] = type(uint256).max;
        
        emit OrderCancelled(orderHash, msg.sender);
    }

    /**
     * @dev Expires options that have passed their expiry time
     * @param optionIds Array of option IDs to expire
     */
    function expireOptions(bytes32[] calldata optionIds) external {
        for (uint256 i = 0; i < optionIds.length; i++) {
            bytes32 optionId = optionIds[i];
            OptionPosition storage position = options[optionId];
            
            if (position.holder != address(0) && 
                !position.isExercised && 
                !position.isExpired &&
                block.timestamp >= position.spec.expiryTime) {
                
                position.isExpired = true;
                
                // Release collateral back to writer
                _releaseCollateral(optionId);
                
                emit OptionExpired(optionId, position.writer, position.collateral);
            }
        }
    }

    // ============ View Functions ============
    
    /**
     * @dev Get option details
     */
    function getOption(bytes32 optionId) external view returns (OptionPosition memory) {
        return options[optionId];
    }

    /**
     * @dev Get user's options
     */
    function getUserOptions(address user) external view returns (bytes32[] memory) {
        return userOptions[user];
    }

    /**
     * @dev Calculate option hash for signature verification
     */
    function getOrderHash(OptionOrder calldata order) external view returns (bytes32) {
        return _getOrderHash(order);
    }

    /**
     * @dev Check if order is filled or cancelled
     */
    function isOrderValid(bytes32 orderHash) external view returns (bool) {
        return cancelledOrFilled[orderHash] == 0;
    }

    /**
     * @dev Get current option price
     */
    function getOptionPrice(OptionSpec calldata spec) external view returns (uint256) {
        require(optionsCalculator != address(0), "Calculator not set");
        
        uint256 currentPrice = _getCurrentPrice(spec.underlying, spec.oracle);
        uint256 timeToExpiry = spec.expiryTime > block.timestamp ? 
            spec.expiryTime - block.timestamp : 0;
        
        // Call external options calculator
        (bool success, bytes memory result) = optionsCalculator.staticcall(
            abi.encodeWithSignature(
                "calculateOptionPrice(uint8,uint256,uint256,uint256,uint256)",
                uint8(spec.optionType),
                currentPrice,
                spec.strikePrice,
                timeToExpiry,
                _getImpliedVolatility(spec.underlying)
            )
        );
        
        require(success, "Price calculation failed");
        return abi.decode(result, (uint256));
    }

    // ============ Internal Functions ============
    
    function _getOrderHash(OptionOrder calldata order) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            OPTION_ORDER_TYPEHASH,
            order.maker,
            order.taker,
            order.makerAsset,
            order.takerAsset,
            order.makerAmount,
            order.takerAmount,
            order.salt,
            order.expiration,
            keccak256(order.predicate),
            keccak256(order.makerAssetData),
            keccak256(order.takerAssetData),
            keccak256(order.interaction)
        )));
    }

    function _isValidSignature(address signer, bytes32 hash, bytes calldata signature) internal pure returns (bool) {
        return hash.recover(signature) == signer;
    }

    function _isValidOptionSpec(OptionSpec memory spec) internal view returns (bool) {
        // Basic validation
        if (spec.expiryTime <= block.timestamp) return false;
        if (spec.strikePrice == 0) return false;
        if (spec.contractSize == 0) return false;
        if (spec.oracle == address(0)) return false;
        if (bytes(spec.underlying).length == 0) return false;
        
        // Check if oracle is registered for this asset
        return assetOracles[spec.underlying] == spec.oracle;
    }

    function _calculateRequiredCollateral(OptionSpec memory spec, uint256 providedAmount) internal view returns (uint256) {
        if (spec.optionType == OptionType.CALL) {
            // For calls, collateral is the underlying asset amount
            return spec.contractSize;
        } else {
            // For puts, collateral is strike price * contract size
            return (spec.strikePrice * spec.contractSize * minCollateralRatio) / (100 * 1e18);
        }
    }

    function _getCurrentPrice(string memory underlying, address oracle) internal view returns (uint256) {
        (bool success, bytes memory result) = oracle.staticcall(
            abi.encodeWithSignature("getPrice(string)", underlying)
        );
        require(success, "Oracle call failed");
        return abi.decode(result, (uint256));
    }

    function _calculatePayout(OptionSpec memory spec, uint256 currentPrice) internal pure returns (uint256) {
        if (spec.optionType == OptionType.CALL) {
            return currentPrice > spec.strikePrice ? 
                ((currentPrice - spec.strikePrice) * spec.contractSize) / 1e18 : 0;
        } else {
            return spec.strikePrice > currentPrice ? 
                ((spec.strikePrice - currentPrice) * spec.contractSize) / 1e18 : 0;
        }
    }

    function _executeSettlement(bytes32 optionId, uint256 payout, uint256 settlementPrice) internal {
        require(settlementEngine != address(0), "Settlement engine not set");
        
        (bool success,) = settlementEngine.call(
            abi.encodeWithSignature(
                "settleOption(bytes32,uint256,uint256)",
                optionId,
                payout,
                settlementPrice
            )
        );
        require(success, "Settlement failed");
    }

    function _releaseCollateral(bytes32 optionId) internal {
        require(collateralVault != address(0), "Collateral vault not set");
        
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature("releaseCollateral(bytes32)", optionId)
        );
        require(success, "Collateral release failed");
    }

    function _executeInteraction(bytes calldata interaction, bytes32 optionId) internal {
        // Decode and execute post-interaction calls
        // This allows for complex strategies and integrations
        (address target, bytes memory callData) = abi.decode(interaction, (address, bytes));
        
        require(target != address(this), "Cannot call self");
        require(target.code.length > 0, "Target not a contract");
        
        (bool success,) = target.call(callData);
        require(success, "Interaction failed");
    }

    function _getImpliedVolatility(string memory underlying) internal view returns (uint256) {
        // Simplified - would integrate with volatility oracle in production
        if (keccak256(bytes(underlying)) == keccak256(bytes("ETH"))) return 80; // 80%
        if (keccak256(bytes(underlying)) == keccak256(bytes("BTC"))) return 75; // 75%
        return 50; // 50% default
    }

    // ============ Admin Functions ============
    
    function setCollateralVault(address _vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        collateralVault = _vault;
    }

    function setSettlementEngine(address _engine) external onlyRole(DEFAULT_ADMIN_ROLE) {
        settlementEngine = _engine;
    }

    function setRiskManager(address _manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        riskManager = _manager;
    }

    function setOptionsCalculator(address _calculator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        optionsCalculator = _calculator;
    }

    function setAssetOracle(string memory asset, address oracle) external onlyRole(OPERATOR_ROLE) {
        assetOracles[asset] = oracle;
    }

    function setProtocolParameters(
        uint256 _maxOrderDuration,
        uint256 _minCollateralRatio,
        uint256 _protocolFee,
        address _feeRecipient
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_protocolFee <= 1000, "Fee too high"); // Max 10%
        require(_minCollateralRatio >= 100, "Collateral ratio too low");
        
        maxOrderDuration = _maxOrderDuration;
        minCollateralRatio = _minCollateralRatio;
        protocolFee = _protocolFee;
        feeRecipient = _feeRecipient;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============ Emergency Functions ============
    
    function emergencyWithdraw(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenPaused 
    {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}