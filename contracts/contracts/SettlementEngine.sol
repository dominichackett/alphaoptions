// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title SettlementEngine
 * @dev Advanced settlement system for multi-asset options
 * Handles exercise, automatic expiry, payout calculations, and fund distribution
 */
contract SettlementEngine is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant OPTIONS_PROTOCOL_ROLE = keccak256("OPTIONS_PROTOCOL_ROLE");
    bytes32 public constant SETTLEMENT_KEEPER_ROLE = keccak256("SETTLEMENT_KEEPER_ROLE");
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_SETTLEMENT_DELAY = 24 hours;
    uint256 public constant AUTO_EXERCISE_THRESHOLD = 1e15; // 0.001 ETH equivalent
    uint256 public constant MAX_SLIPPAGE = 500; // 5% max slippage protection

    // ============ Enums ============
    
    enum OptionType { CALL, PUT }
    enum OptionStyle { EUROPEAN, AMERICAN }
    enum AssetType { CRYPTO, FOREX, STOCK }
    enum SettlementStatus { PENDING, EXERCISED, EXPIRED, CANCELLED }
    enum SettlementType { MANUAL_EXERCISE, AUTO_EXERCISE, AUTO_EXPIRY }

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

    struct SettlementRequest {
        bytes32 optionId;
        address holder;
        address writer;
        OptionSpec spec;
        uint256 exercisePrice;
        uint256 settlementPrice;
        uint256 requestTime;
        uint256 payout;
        SettlementType settlementType;
        SettlementStatus status;
        bool isProcessed;
    }

    struct PayoutCalculation {
        uint256 intrinsicValue;
        uint256 timeValue;
        uint256 totalPayout;
        uint256 fees;
        uint256 netPayout;
        uint256 collateralReturned;
        bool isInTheMoney;
    }

    struct SettlementFees {
        uint256 exerciseFee;        // Fee for manual exercise
        uint256 autoExerciseFee;    // Fee for auto exercise
        uint256 expiryFee;          // Fee for expiry processing
        uint256 earlyExerciseFee;   // Additional fee for early exercise
        address feeRecipient;
    }

    struct AssetSettlementConfig {
        bool isActive;
        uint256 settlementDelay;    // Delay before settlement execution
        uint256 priceTolerrance;    // Maximum price movement tolerance
        bool autoExerciseEnabled;   // Whether auto-exercise is enabled
        uint256 minAutoExerciseValue; // Minimum value for auto-exercise
        address preferredToken;     // Preferred settlement token
    }

    // ============ State Variables ============
    
    mapping(bytes32 => SettlementRequest) public settlementRequests;
    mapping(bytes32 => PayoutCalculation) public payoutCalculations;
    mapping(string => AssetSettlementConfig) public assetConfigs;
    mapping(bytes32 => bool) public autoExerciseQueue;
    mapping(address => uint256) public userNonces;
    
    bytes32[] public pendingSettlements;
    bytes32[] public autoExerciseList;
    
    // Contract dependencies
    address public optionsProtocol;
    address public collateralVault;
    address public priceOracle;
    address public riskManager;
    
    // Settlement parameters
    SettlementFees public fees;
    uint256 public defaultSettlementDelay = 300; // 5 minutes
    uint256 public maxBatchSize = 50;
    bool public autoSettlementEnabled = true;
    
    // Statistics and tracking
    uint256 public totalSettlements;
    uint256 public totalPayouts;
    uint256 public totalFeesCollected;
    mapping(string => uint256) public assetVolume;
    mapping(address => uint256) public userVolume;

    // ============ Events ============
    
    event SettlementRequested(
        bytes32 indexed optionId,
        address indexed holder,
        SettlementType settlementType,
        uint256 exercisePrice,
        uint256 requestTime
    );

    event SettlementProcessed(
        bytes32 indexed optionId,
        address indexed holder,
        address indexed writer,
        uint256 payout,
        uint256 collateralReturned,
        uint256 fees
    );

    event AutoExerciseTriggered(
        bytes32 indexed optionId,
        uint256 intrinsicValue,
        uint256 settlementPrice
    );

    event OptionExpired(
        bytes32 indexed optionId,
        address indexed writer,
        uint256 collateralReleased,
        bool wasInTheMoney
    );

    event BatchSettlementCompleted(
        uint256 processedCount,
        uint256 totalPayout,
        uint256 totalFees
    );

    event EmergencySettlement(
        bytes32 indexed optionId,
        address indexed initiator,
        string reason
    );

    // ============ Modifiers ============
    
    modifier onlyOptionsProtocol() {
        require(hasRole(OPTIONS_PROTOCOL_ROLE, msg.sender), "Only options protocol");
        _;
    }

    modifier onlySettlementKeeper() {
        require(hasRole(SETTLEMENT_KEEPER_ROLE, msg.sender), "Only settlement keeper");
        _;
    }

    modifier validOptionId(bytes32 optionId) {
        require(settlementRequests[optionId].optionId != bytes32(0), "Invalid option ID");
        _;
    }

    modifier notProcessed(bytes32 optionId) {
        require(!settlementRequests[optionId].isProcessed, "Already processed");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _admin,
        address _optionsProtocol,
        address _collateralVault,
        address _feeRecipient
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(OPTIONS_PROTOCOL_ROLE, _optionsProtocol);
        _grantRole(SETTLEMENT_KEEPER_ROLE, _admin);
        
        optionsProtocol = _optionsProtocol;
        collateralVault = _collateralVault;
        
        // Initialize default fees
        fees = SettlementFees({
            exerciseFee: 25, // $25 equivalent
            autoExerciseFee: 10, // $10 equivalent
            expiryFee: 5, // $5 equivalent
            earlyExerciseFee: 50, // $50 equivalent
            feeRecipient: _feeRecipient
        });
    }

    // ============ Core Settlement Functions ============
    
    /**
     * @dev Initiates option settlement (exercise or expiry)
     * @param optionId Unique option identifier
     * @param holder Option holder address
     * @param writer Option writer address
     * @param spec Option specifications
     * @param settlementType Type of settlement
     */
    function initiateSettlement(
        bytes32 optionId,
        address holder,
        address writer,
        OptionSpec calldata spec,
        SettlementType settlementType
    ) external onlyOptionsProtocol nonReentrant whenNotPaused {
        require(settlementRequests[optionId].optionId == bytes32(0), "Settlement already exists");
        
        // Get current price for settlement
        uint256 currentPrice = _getCurrentPrice(spec.underlying, spec.oracle);
        
        // Validate settlement conditions
        _validateSettlement(spec, settlementType, currentPrice);
        
        // Create settlement request
        settlementRequests[optionId] = SettlementRequest({
            optionId: optionId,
            holder: holder,
            writer: writer,
            spec: spec,
            exercisePrice: currentPrice,
            settlementPrice: currentPrice, // Will be updated at execution
            requestTime: block.timestamp,
            payout: 0, // Will be calculated
            settlementType: settlementType,
            status: SettlementStatus.PENDING,
            isProcessed: false
        });
        
        // Add to pending queue
        pendingSettlements.push(optionId);
        
        // Check if eligible for auto-exercise
        if (settlementType == SettlementType.AUTO_EXERCISE) {
            autoExerciseQueue[optionId] = true;
            autoExerciseList.push(optionId);
        }
        
        emit SettlementRequested(
            optionId,
            holder,
            settlementType,
            currentPrice,
            block.timestamp
        );
    }

    /**
     * @dev Processes a settlement request
     * @param optionId Option to settle
     */
    function processSettlement(bytes32 optionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validOptionId(optionId) 
        notProcessed(optionId) 
    {
        SettlementRequest storage request = settlementRequests[optionId];
        
        // Check settlement delay has passed
        AssetSettlementConfig memory config = assetConfigs[request.spec.underlying];
        uint256 requiredDelay = config.isActive ? config.settlementDelay : defaultSettlementDelay;
        
        require(
            block.timestamp >= request.requestTime + requiredDelay,
            "Settlement delay not met"
        );
        
        // Get final settlement price
        uint256 finalPrice = _getCurrentPrice(request.spec.underlying, request.spec.oracle);
        
        // Validate price hasn't moved too much
        _validatePriceMovement(request.exercisePrice, finalPrice, config.priceTolerrance);
        
        // Update settlement price
        request.settlementPrice = finalPrice;
        
        // Calculate payout
        PayoutCalculation memory calculation = _calculatePayout(request.spec, finalPrice);
        payoutCalculations[optionId] = calculation;
        
        // Update request with payout
        request.payout = calculation.netPayout;
        
        // Execute settlement
        if (calculation.isInTheMoney && calculation.netPayout > 0) {
            request.status = SettlementStatus.EXERCISED;
            _executeExercise(optionId, request, calculation);
        } else {
            request.status = SettlementStatus.EXPIRED;
            _executeExpiry(optionId, request);
        }
        
        // Mark as processed
        request.isProcessed = true;
        
        // Update statistics
        _updateStatistics(optionId, request, calculation);
        
        // Remove from pending queue
        _removePendingSettlement(optionId);
        
        emit SettlementProcessed(
            optionId,
            request.holder,
            request.writer,
            calculation.netPayout,
            calculation.collateralReturned,
            calculation.fees
        );
    }

    /**
     * @dev Processes multiple settlements in batch
     * @param optionIds Array of option IDs to process
     */
    function batchProcessSettlements(bytes32[] calldata optionIds) 
        external 
        onlySettlementKeeper 
        nonReentrant 
        whenNotPaused 
    {
        require(optionIds.length <= maxBatchSize, "Batch too large");
        
        uint256 processedCount = 0;
        uint256 totalBatchPayout = 0;
        uint256 totalBatchFees = 0;
        
        for (uint256 i = 0; i < optionIds.length; i++) {
            bytes32 optionId = optionIds[i];
            
            if (_canProcessSettlement(optionId)) {
                SettlementRequest storage request = settlementRequests[optionId];
                
                // Get final settlement price
                uint256 finalPrice = _getCurrentPrice(request.spec.underlying, request.spec.oracle);
                request.settlementPrice = finalPrice;
                
                // Calculate payout
                PayoutCalculation memory calculation = _calculatePayout(request.spec, finalPrice);
                payoutCalculations[optionId] = calculation;
                request.payout = calculation.netPayout;
                
                // Execute settlement
                if (calculation.isInTheMoney && calculation.netPayout > 0) {
                    request.status = SettlementStatus.EXERCISED;
                    _executeExercise(optionId, request, calculation);
                } else {
                    request.status = SettlementStatus.EXPIRED;
                    _executeExpiry(optionId, request);
                }
                
                request.isProcessed = true;
                processedCount++;
                totalBatchPayout += calculation.netPayout;
                totalBatchFees += calculation.fees;
                
                _updateStatistics(optionId, request, calculation);
                _removePendingSettlement(optionId);
            }
        }
        
        emit BatchSettlementCompleted(processedCount, totalBatchPayout, totalBatchFees);
    }

    /**
     * @dev Auto-exercises options that are in-the-money near expiry
     * @param maxProcessed Maximum number of options to process
     */
    function autoExerciseExpiring(uint256 maxProcessed) 
        external 
        onlySettlementKeeper 
        nonReentrant 
        whenNotPaused 
    {
        require(autoSettlementEnabled, "Auto settlement disabled");
        
        uint256 processed = 0;
        uint256 i = 0;
        
        while (i < autoExerciseList.length && processed < maxProcessed) {
            bytes32 optionId = autoExerciseList[i];
            
            if (autoExerciseQueue[optionId]) {
                SettlementRequest memory request = settlementRequests[optionId];
                
                // Check if close to expiry and in-the-money
                if (_shouldAutoExercise(request)) {
                    uint256 currentPrice = _getCurrentPrice(request.spec.underlying, request.spec.oracle);
                    PayoutCalculation memory calculation = _calculatePayout(request.spec, currentPrice);
                    
                    if (calculation.isInTheMoney && calculation.intrinsicValue >= AUTO_EXERCISE_THRESHOLD) {
                        // Auto exercise
                        request.settlementPrice = currentPrice;
                        request.payout = calculation.netPayout;
                        request.status = SettlementStatus.EXERCISED;
                        request.isProcessed = true;
                        
                        settlementRequests[optionId] = request;
                        payoutCalculations[optionId] = calculation;
                        
                        _executeExercise(optionId, request, calculation);
                        
                        autoExerciseQueue[optionId] = false;
                        processed++;
                        
                        emit AutoExerciseTriggered(optionId, calculation.intrinsicValue, currentPrice);
                    }
                }
            }
            
            i++;
        }
        
        // Clean up processed items from auto exercise list
        _cleanupAutoExerciseList();
    }

    // ============ Calculation Functions ============
    
    /**
     * @dev Calculates option payout at settlement
     * @param spec Option specifications
     * @param settlementPrice Current market price
     * @return calculation Detailed payout calculation
     */
    function calculateSettlementPayout(OptionSpec calldata spec, uint256 settlementPrice) 
        external 
        view 
        returns (PayoutCalculation memory calculation) 
    {
        return _calculatePayout(spec, settlementPrice);
    }

    /**
     * @dev Gets settlement fee for option type
     * @param settlementType Type of settlement
     * @param isEarlyExercise Whether this is early exercise
     * @return fee Settlement fee amount
     */
    function getSettlementFee(SettlementType settlementType, bool isEarlyExercise) 
        external 
        view 
        returns (uint256 fee) 
    {
        if (settlementType == SettlementType.MANUAL_EXERCISE) {
            fee = fees.exerciseFee;
        } else if (settlementType == SettlementType.AUTO_EXERCISE) {
            fee = fees.autoExerciseFee;
        } else {
            fee = fees.expiryFee;
        }
        
        if (isEarlyExercise) {
            fee += fees.earlyExerciseFee;
        }
        
        return fee;
    }

    // ============ View Functions ============
    
    /**
     * @dev Gets settlement request details
     * @param optionId Option identifier
     * @return request Settlement request
     */
    function getSettlementRequest(bytes32 optionId) 
        external 
        view 
        returns (SettlementRequest memory) 
    {
        return settlementRequests[optionId];
    }

    /**
     * @dev Gets payout calculation details
     * @param optionId Option identifier
     * @return calculation Payout calculation
     */
    function getPayoutCalculation(bytes32 optionId) 
        external 
        view 
        returns (PayoutCalculation memory) 
    {
        return payoutCalculations[optionId];
    }

    /**
     * @dev Gets pending settlements
     * @return pending Array of pending settlement IDs
     */
    function getPendingSettlements() external view returns (bytes32[] memory) {
        return pendingSettlements;
    }

    /**
     * @dev Gets auto-exercise queue
     * @return queue Array of options in auto-exercise queue
     */
    function getAutoExerciseQueue() external view returns (bytes32[] memory) {
        return autoExerciseList;
    }

    /**
     * @dev Checks if settlement can be processed
     * @param optionId Option identifier
     * @return canProcess Whether settlement can be processed
     */
    function canProcessSettlement(bytes32 optionId) external view returns (bool) {
        return _canProcessSettlement(optionId);
    }

    // ============ Internal Functions ============
    
    function _validateSettlement(
        OptionSpec memory spec,
        SettlementType settlementType,
        uint256 currentPrice
    ) internal view {
        // Check expiry
        if (settlementType == SettlementType.AUTO_EXPIRY) {
            require(block.timestamp >= spec.expiryTime, "Option not expired");
        } else {
            require(block.timestamp < spec.expiryTime, "Option expired");
        }
        
        // Check style for early exercise
        if (settlementType == SettlementType.MANUAL_EXERCISE && spec.style == OptionStyle.EUROPEAN) {
            require(
                block.timestamp >= spec.expiryTime - 1 hours,
                "European option can only be exercised near expiry"
            );
        }
        
        // Validate oracle price
        require(currentPrice > 0, "Invalid oracle price");
    }

    function _calculatePayout(OptionSpec memory spec, uint256 settlementPrice) 
        internal 
        view 
        returns (PayoutCalculation memory calculation) 
    {
        // Calculate intrinsic value
        if (spec.optionType == OptionType.CALL) {
            calculation.intrinsicValue = settlementPrice > spec.strikePrice ? 
                ((settlementPrice - spec.strikePrice) * spec.contractSize) / PRECISION : 0;
        } else {
            calculation.intrinsicValue = spec.strikePrice > settlementPrice ? 
                ((spec.strikePrice - settlementPrice) * spec.contractSize) / PRECISION : 0;
        }
        
        calculation.isInTheMoney = calculation.intrinsicValue > 0;
        
        // Time value is 0 at settlement
        calculation.timeValue = 0;
        calculation.totalPayout = calculation.intrinsicValue;
        
        // Calculate fees
        bool isEarlyExercise = block.timestamp < spec.expiryTime - 1 hours;
        calculation.fees = getSettlementFee(SettlementType.MANUAL_EXERCISE, isEarlyExercise);
        
        // Net payout after fees
        calculation.netPayout = calculation.totalPayout > calculation.fees ? 
            calculation.totalPayout - calculation.fees : 0;
        
        // Collateral returned to writer (remaining after payout)
        calculation.collateralReturned = calculation.totalPayout;
        
        return calculation;
    }

    function _executeExercise(
        bytes32 optionId,
        SettlementRequest memory request,
        PayoutCalculation memory calculation
    ) internal {
        // Transfer payout to holder
        if (calculation.netPayout > 0) {
            _transferPayout(request.holder, calculation.netPayout);
        }
        
        // Transfer fees to fee recipient
        if (calculation.fees > 0) {
            _transferFees(calculation.fees);
        }
        
        // Release remaining collateral to writer through vault
        _releaseCollateralToWriter(optionId, request.writer, calculation.collateralReturned);
    }

    function _executeExpiry(bytes32 optionId, SettlementRequest memory request) internal {
        // Release all collateral back to writer
        _releaseAllCollateral(optionId);
        
        emit OptionExpired(
            optionId,
            request.writer,
            0, // Will be filled by vault
            false // Was not ITM
        );
    }

    function _shouldAutoExercise(SettlementRequest memory request) internal view returns (bool) {
        // Check if close to expiry (within 1 hour)
        bool closeToExpiry = block.timestamp >= request.spec.expiryTime - 1 hours;
        
        // Check if asset has auto-exercise enabled
        AssetSettlementConfig memory config = assetConfigs[request.spec.underlying];
        bool autoEnabled = config.isActive ? config.autoExerciseEnabled : true;
        
        return closeToExpiry && autoEnabled && !request.isProcessed;
    }

    function _canProcessSettlement(bytes32 optionId) internal view returns (bool) {
        SettlementRequest memory request = settlementRequests[optionId];
        
        if (request.optionId == bytes32(0) || request.isProcessed) {
            return false;
        }
        
        AssetSettlementConfig memory config = assetConfigs[request.spec.underlying];
        uint256 requiredDelay = config.isActive ? config.settlementDelay : defaultSettlementDelay;
        
        return block.timestamp >= request.requestTime + requiredDelay;
    }

    function _validatePriceMovement(uint256 exercisePrice, uint256 finalPrice, uint256 tolerance) internal pure {
        if (tolerance == 0) return; // No tolerance check
        
        uint256 priceDiff = exercisePrice > finalPrice ? 
            exercisePrice - finalPrice : finalPrice - exercisePrice;
        
        uint256 maxAllowedDiff = (exercisePrice * tolerance) / 10000;
        
        require(priceDiff <= maxAllowedDiff, "Price moved too much");
    }

    function _getCurrentPrice(string memory underlying, address oracle) internal view returns (uint256) {
        (bool success, bytes memory result) = oracle.staticcall(
            abi.encodeWithSignature("getPrice(string)", underlying)
        );
        require(success, "Oracle call failed");
        return abi.decode(result, (uint256));
    }

    function _transferPayout(address recipient, uint256 amount) internal {
        // This would integrate with CollateralVault to transfer funds
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature("transferPayout(address,uint256)", recipient, amount)
        );
        require(success, "Payout transfer failed");
    }

    function _transferFees(uint256 amount) internal {
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature("transferFees(address,uint256)", fees.feeRecipient, amount)
        );
        require(success, "Fee transfer failed");
    }

    function _releaseCollateralToWriter(bytes32 optionId, address writer, uint256 remainingAmount) internal {
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature("releaseCollateralToWriter(bytes32,address,uint256)", optionId, writer, remainingAmount)
        );
        require(success, "Collateral release failed");
    }

    function _releaseAllCollateral(bytes32 optionId) internal {
        (bool success,) = collateralVault.call(
            abi.encodeWithSignature("releaseCollateral(bytes32)", optionId)
        );
        require(success, "Full collateral release failed");
    }

    function _updateStatistics(
        bytes32 optionId,
        SettlementRequest memory request,
        PayoutCalculation memory calculation
    ) internal {
        totalSettlements++;
        totalPayouts += calculation.netPayout;
        totalFeesCollected += calculation.fees;
        
        assetVolume[request.spec.underlying] += calculation.totalPayout;
        userVolume[request.holder] += calculation.netPayout;
    }

    function _removePendingSettlement(bytes32 optionId) internal {
        for (uint256 i = 0; i < pendingSettlements.length; i++) {
            if (pendingSettlements[i] == optionId) {
                pendingSettlements[i] = pendingSettlements[pendingSettlements.length - 1];
                pendingSettlements.pop();
                break;
            }
        }
    }

    function _cleanupAutoExerciseList() internal {
        uint256 writeIndex = 0;
        
        for (uint256 i = 0; i < autoExerciseList.length; i++) {
            if (autoExerciseQueue[autoExerciseList[i]]) {
                autoExerciseList[writeIndex] = autoExerciseList[i];
                writeIndex++;
            }
        }
        
        // Truncate array
        while (autoExerciseList.length > writeIndex) {
            autoExerciseList.pop();
        }
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Sets asset settlement configuration
     * @param underlying Asset symbol
     * @param config Settlement configuration
     */
    function setAssetConfig(string calldata underlying, AssetSettlementConfig calldata config) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(config.settlementDelay <= MAX_SETTLEMENT_DELAY, "Delay too long");
        assetConfigs[underlying] = config;
    }

    /**
     * @dev Updates settlement fees
     * @param newFees Updated fee structure
     */
    function setSettlementFees(SettlementFees calldata newFees) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newFees.exerciseFee <= 100, "Exercise fee too high"); // Max $100
        require(newFees.autoExerciseFee <= 50, "Auto exercise fee too high"); // Max $50
        require(newFees.earlyExerciseFee <= 200, "Early exercise fee too high"); // Max $200
        
        fees = newFees;
    }

    function setProtocolAddresses(
        address _priceOracle,
        address _riskManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceOracle = _priceOracle;
        riskManager = _riskManager;
    }

    function setProtocolParameters(
        uint256 _defaultSettlementDelay,
        uint256 _maxBatchSize,
        bool _autoSettlementEnabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_defaultSettlementDelay <= MAX_SETTLEMENT_DELAY, "Delay too long");
        require(_maxBatchSize <= 100, "Batch size too large");
        
        defaultSettlementDelay = _defaultSettlementDelay;
        maxBatchSize = _maxBatchSize;
        autoSettlementEnabled = _autoSettlementEnabled;
    }

    // ============ Emergency Functions ============
    
    function emergencySettlement(bytes32 optionId, string calldata reason) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenPaused 
    {
        SettlementRequest storage request = settlementRequests[optionId];
        require(request.optionId != bytes32(0), "Invalid option");
        
        request.status = SettlementStatus.CANCELLED;
        request.isProcessed = true;
        
        // Release all collateral back to writer
        _releaseAllCollateral(optionId);
        
        emit EmergencySettlement(optionId, msg.sender, reason);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}