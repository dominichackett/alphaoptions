// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// 1inch Limit Order Protocol Interfaces
interface ILimitOrderProtocol {
    struct Order {
        uint256 salt;
        address makerAsset;
        address takerAsset;
        address maker;
        address receiver;
        address allowedSender;
        uint256 makingAmount;
        uint256 takingAmount;
        uint256 offsets;
        bytes interactions;
    }

    function fillOrder(
        Order calldata order,
        bytes calldata signature,
        bytes calldata interaction,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 skipPermitAndThresholdAmount
    ) external payable returns (uint256 actualMakingAmount, uint256 actualTakingAmount, bytes32 orderHash);

    function cancelOrder(Order calldata order) external returns (uint256 orderRemaining, bytes32 orderHash);
    
    function remaining(bytes32 orderHash) external view returns (uint256);
    
    function remainingRaw(bytes32 orderHash) external view returns (uint256);
}

/**
 * @title OptionsProtocol - 1inch Integration
 * @dev Advanced options protocol using 1inch Limit Order Protocol for execution
 * Enables multi-asset options trading with 24/7 availability and professional features
 */
contract OptionsProtocol is ReentrancyGuard, AccessControl, Pausable, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    
    // 1inch Integration
    ILimitOrderProtocol public immutable inchProtocol;
    
    // EIP-712 Type Hashes for Options
    bytes32 private constant OPTION_ORDER_TYPEHASH = keccak256(
        "OptionOrder(address maker,address taker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 expiration,bytes optionData,bytes interaction)"
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
        bytes optionData;       // Encoded option specifications
        bytes interaction;      // Post-interaction calls
    }

    struct OptionSpec {
        AssetType assetType;    // CRYPTO, FOREX, STOCK
        string underlying;      // Asset symbol (ETH, EUR/USD, AAPL)
        OptionType optionType;  // CALL or PUT
        OptionStyle style;      // EUROPEAN or AMERICAN
        uint256 strikePrice;    // Strike price (scaled by 1e18)
        uint256 expiryTime;     // Option expiry timestamp
        uint256 contractSize;   // Number of units
        address oracle;         // Price oracle address
    }

    struct OptionPosition {
        bytes32 optionId;       // Unique option identifier
        bytes32 inchOrderHash;  // 1inch order hash for tracking
        address holder;         // Current option holder
        address writer;         // Option writer (seller)
        OptionSpec spec;        // Option specifications
        uint256 premium;        // Premium paid
        uint256 collateral;     // Collateral locked
        address collateralToken; // Collateral token address
        bool isExercised;       // Exercise status
        bool isExpired;         // Expiry status
        uint256 createdAt;      // Creation timestamp
        uint256 inchMakingAmount; // Actual amount from 1inch
        uint256 inchTakingAmount; // Actual amount from 1inch
    }

    // ============ State Variables ============
    
    mapping(bytes32 => OptionPosition) public options;
    mapping(address => bytes32[]) public userOptions;
    mapping(string => address) public assetOracles;
    mapping(bytes32 => bool) public cancelledOrders; // Track cancelled 1inch orders
    
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
    
    event OptionCreatedVia1inch(
        bytes32 indexed optionId,
        bytes32 indexed inchOrderHash,
        address indexed maker,
        address indexed taker,
        OptionSpec spec,
        uint256 actualMaking,
        uint256 actualTaking
    );

    event InchOrderFilled(
        bytes32 indexed inchOrderHash,
        bytes32 indexed optionId,
        uint256 actualMakingAmount,
        uint256 actualTakingAmount
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

    event InchOrderCancelled(
        bytes32 indexed inchOrderHash,
        bytes32 indexed optionId,
        address indexed maker
    );

    // ============ Constructor ============
    
    constructor(
        address _admin,
        address _feeRecipient,
        string memory _name,
        string memory _version,
        address _inchProtocol
    ) EIP712(_name, _version) {
        require(_inchProtocol != address(0), "Invalid 1inch protocol address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        
        inchProtocol = ILimitOrderProtocol(_inchProtocol);
        feeRecipient = _feeRecipient;
        _optionCounter = 1;
    }

    // ============ Core 1inch Integration Functions ============
    
    /**
     * @dev Creates and fills an option order using 1inch Limit Order Protocol
     * @param optionOrder The option order struct
     * @param signature Maker's signature
     * @param interaction Optional 1inch interaction data
     * @param makingAmount Desired making amount (0 for full fill)
     * @param takingAmount Desired taking amount (0 for full fill)
     */
    function fillOptionOrderVia1inch(
        OptionOrder calldata optionOrder,
        bytes calldata signature,
        bytes calldata interaction,
        uint256 makingAmount,
        uint256 takingAmount
    ) external nonReentrant whenNotPaused returns (bytes32 optionId) {
        // Validate option order
        require(block.timestamp <= optionOrder.expiration, "Option order expired");
        require(!cancelledOrders[_getOptionOrderHash(optionOrder)], "Order cancelled");
        
        // Decode option specifications
        OptionSpec memory spec = abi.decode(optionOrder.optionData, (OptionSpec));
        require(_isValidOptionSpec(spec), "Invalid option specification");
        
        // Convert to 1inch order format
        ILimitOrderProtocol.Order memory inchOrder = _convertToInchOrder(optionOrder);
        
        // Generate unique option ID
        optionId = keccak256(abi.encodePacked(
            _getOptionOrderHash(optionOrder),
            block.timestamp,
            _optionCounter++
        ));
        
        // Execute order through 1inch Protocol
        (uint256 actualMakingAmount, uint256 actualTakingAmount, bytes32 inchOrderHash) = 
            inchProtocol.fillOrder(
                inchOrder,
                signature,
                interaction,
                makingAmount,
                takingAmount,
                0 // No skip permit
            );
        
        require(actualMakingAmount > 0 && actualTakingAmount > 0, "1inch execution failed");
        
        // Determine taker (buyer)
        address taker = optionOrder.taker == address(0) ? msg.sender : optionOrder.taker;
        require(taker == msg.sender, "Invalid taker");
        
        // Calculate protocol fee
        uint256 fee = (actualTakingAmount * protocolFee) / 10000;
        
        // Create option position
        options[optionId] = OptionPosition({
            optionId: optionId,
            inchOrderHash: inchOrderHash,
            holder: taker,
            writer: optionOrder.maker,
            spec: spec,
            premium: actualTakingAmount,
            collateral: actualMakingAmount,
            collateralToken: optionOrder.makerAsset,
            isExercised: false,
            isExpired: false,
            createdAt: block.timestamp,
            inchMakingAmount: actualMakingAmount,
            inchTakingAmount: actualTakingAmount
        });
        
        // Update tracking
        userOptions[taker].push(optionId);
        userOptions[optionOrder.maker].push(optionId);
        
        // Lock collateral in vault
        _lockCollateralInVault(optionId, optionOrder.maker, spec, actualMakingAmount);
        
        // Handle protocol fee
        if (fee > 0) {
            IERC20(optionOrder.takerAsset).safeTransferFrom(taker, feeRecipient, fee);
        }
        
        emit OptionCreatedVia1inch(
            optionId, 
            inchOrderHash, 
            optionOrder.maker, 
            taker, 
            spec, 
            actualMakingAmount, 
            actualTakingAmount
        );
        
        emit InchOrderFilled(inchOrderHash, optionId, actualMakingAmount, actualTakingAmount);
        
        return optionId;
    }

    /**
     * @dev Cancels an option order through 1inch Protocol
     * @param optionOrder The option order to cancel
     */
    function cancelOptionOrder(OptionOrder calldata optionOrder) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(optionOrder.maker == msg.sender, "Only maker can cancel");
        
        bytes32 orderHash = _getOptionOrderHash(optionOrder);
        require(!cancelledOrders[orderHash], "Already cancelled");
        
        // Convert to 1inch order format
        ILimitOrderProtocol.Order memory inchOrder = _convertToInchOrder(optionOrder);
        
        // Cancel through 1inch Protocol
        (uint256 orderRemaining, bytes32 inchOrderHash) = inchProtocol.cancelOrder(inchOrder);
        
        // Mark as cancelled
        cancelledOrders[orderHash] = true;
        
        emit InchOrderCancelled(inchOrderHash, bytes32(0), msg.sender);
    }

    /**
     * @dev Exercise an option position
     * @param optionId The option to exercise
     */
    function exerciseOption(bytes32 optionId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        OptionPosition storage position = options[optionId];
        require(position.holder == msg.sender, "Not option holder");
        require(!position.isExercised, "Already exercised");
        require(!position.isExpired, "Option expired");
        require(block.timestamp < position.spec.expiryTime, "Past expiry");
        
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
        
        // Execute settlement
        _executeSettlement(optionId, payout, currentPrice);
        
        emit OptionExercised(optionId, position.holder, payout, block.timestamp);
    }

    /**
     * @dev Expire options that have passed their expiry time
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
     * @dev Get 1inch order hash for option order
     */
    function getOptionOrderHash(OptionOrder calldata order) external view returns (bytes32) {
        return _getOptionOrderHash(order);
    }

    /**
     * @dev Check if 1inch order is still valid/unfilled
     */
    function getInchOrderRemaining(bytes32 inchOrderHash) external view returns (uint256) {
        return inchProtocol.remaining(inchOrderHash);
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
    
    function _convertToInchOrder(OptionOrder calldata optionOrder) 
        internal 
        view 
        returns (ILimitOrderProtocol.Order memory) 
    {
        // Convert option order to 1inch limit order format
        return ILimitOrderProtocol.Order({
            salt: optionOrder.salt,
            makerAsset: optionOrder.makerAsset,
            takerAsset: optionOrder.takerAsset,
            maker: optionOrder.maker,
            receiver: optionOrder.taker == address(0) ? address(0) : optionOrder.taker,
            allowedSender: optionOrder.taker == address(0) ? address(0) : optionOrder.taker,
            makingAmount: optionOrder.makerAmount,
            takingAmount: optionOrder.takerAmount,
            offsets: 0, // No predicated/getter functions for basic options
            interactions: optionOrder.interaction
        });
    }

    function _getOptionOrderHash(OptionOrder calldata order) internal view returns (bytes32) {
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
            keccak256(order.optionData),
            keccak256(order.interaction)
        )));
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

    function _lockCollateralInVault(
        bytes32 optionId,
        address maker,
        OptionSpec memory spec,
        uint256 collateralAmount
    ) internal {
        require(collateralVault != address(0), "Collateral vault not set");
        
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature(
                "lockCollateral(bytes32,address,address,uint256,uint256,uint8)",
                optionId,
                maker,
                options[optionId].collateralToken,
                collateralAmount,
                _calculateRequiredCollateral(spec),
                0 // ISOLATED margin type for basic implementation
            )
        );
        require(success, "Collateral locking failed");
    }

    function _calculateRequiredCollateral(OptionSpec memory spec) internal pure returns (uint256) {
        if (spec.optionType == OptionType.CALL) {
            // For calls, collateral is the underlying asset amount
            return spec.contractSize;
        } else {
            // For puts, collateral is strike price * contract size
            return (spec.strikePrice * spec.contractSize) / 1e18;
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