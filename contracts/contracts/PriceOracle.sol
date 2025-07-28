// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Chainlink interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

// Custom oracle interface for non-Chainlink sources
interface ICustomOracle {
    function getPrice() external view returns (uint256 price, uint256 updatedAt);
    function getLatestPrice() external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title PriceOracle
 * @dev Multi-source price aggregation system for crypto, forex, and stock assets
 * Enables 24/7 pricing with manipulation protection and redundancy
 * 
 * KEY FEATURE: Enables 24/7 stock options trading - your competitive advantage!
 */
contract PriceOracle is ReentrancyGuard, AccessControl, Pausable {
    using Math for uint256;

    // ============ Constants ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PRICE_KEEPER_ROLE = keccak256("PRICE_KEEPER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_PRICE_DEVIATION = 1000; // 10% max deviation
    uint256 public constant MAX_STALENESS = 24 hours;
    uint256 public constant MIN_SOURCES = 1;
    uint256 public constant MAX_SOURCES = 5;

    // ============ Enums ============
    
    enum AssetType { CRYPTO, FOREX, STOCK }
    enum SourceType { CHAINLINK, API3, BAND, CUSTOM, SYNTHETIC }
    enum PriceStatus { ACTIVE, STALE, INVALID, EMERGENCY }

    // ============ Structs ============
    
    struct PriceSource {
        SourceType sourceType;
        address sourceAddress;
        uint256 weight;          // Weight for weighted average (basis points)
        uint256 maxStaleness;    // Maximum staleness tolerance
        uint256 decimals;        // Price decimals
        bool isActive;
        uint256 lastUpdateTime;
        int256 lastPrice;
        string description;
    }

    struct AssetConfig {
        AssetType assetType;
        string symbol;
        bool isActive;
        uint256 minSources;      // Minimum sources required
        uint256 maxDeviation;    // Maximum price deviation allowed
        uint256 emergencyPrice;  // Emergency fallback price
        uint256 emergencyTime;   // When emergency price was set
        PriceSource[] sources;
        mapping(address => uint256) sourceIndex; // Source address to index mapping
    }

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 confidence;      // Confidence score (0-10000)
        PriceStatus status;
        uint256 sourceCount;     // Number of sources used
        uint256 deviation;       // Price deviation percentage
    }

    struct AggregatedPrice {
        uint256 weightedPrice;
        uint256 medianPrice;
        uint256 averagePrice;
        uint256 minPrice;
        uint256 maxPrice;
        uint256 validSources;
        uint256 totalWeight;
        uint256 lastUpdate;
    }

    // Market hours configuration for different asset types
    struct MarketHours {
        uint256 openTime;        // Market open time (seconds from midnight UTC)
        uint256 closeTime;       // Market close time (seconds from midnight UTC)
        bool[7] tradingDays;     // Which days market is open (0=Sunday, 6=Saturday)
        bool isAlwaysOpen;       // True for 24/7 markets (crypto)
        string timezone;         // Market timezone
    }

    // ============ State Variables ============
    
    mapping(string => AssetConfig) private assetConfigs;
    mapping(string => PriceData) public currentPrices;
    mapping(string => AggregatedPrice) public aggregatedPrices;
    mapping(string => MarketHours) public marketHours;
    mapping(string => uint256[]) private priceHistory; // Last 24 prices for each asset
    
    string[] public supportedAssets;
    mapping(string => bool) public assetExists;
    
    // Circuit breaker and emergency controls
    bool public emergencyMode;
    mapping(string => bool) public assetEmergencyMode;
    uint256 public emergencyThreshold = 5000; // 50% price movement triggers emergency
    
    // Update frequency and keeper settings
    uint256 public updateInterval = 300; // 5 minutes default
    uint256 public keeperReward = 1e15; // 0.001 ETH keeper reward
    address public keeperRewardToken;
    
    // Price validation parameters
    uint256 public globalMaxStaleness = 1 hours;
    uint256 public minimumConfidence = 7000; // 70% minimum confidence
    uint256 public volatilityThreshold = 2000; // 20% volatility threshold

    // ============ Events ============
    
    event PriceUpdated(
        string indexed asset,
        uint256 price,
        uint256 timestamp,
        uint256 confidence,
        uint256 sourceCount
    );

    event SourceAdded(
        string indexed asset,
        address indexed source,
        SourceType sourceType,
        uint256 weight
    );

    event SourceRemoved(
        string indexed asset,
        address indexed source
    );

    event EmergencyPriceSet(
        string indexed asset,
        uint256 price,
        string reason
    );

    event PriceDeviation(
        string indexed asset,
        uint256 currentPrice,
        uint256 expectedPrice,
        uint256 deviation
    );

    event KeeperRewardPaid(
        address indexed keeper,
        uint256 reward,
        uint256 assetsUpdated
    );

    event SyntheticStockPriceUpdated(
        string indexed stockSymbol,
        uint256 price,
        bool isMarketHours,
        uint256 confidence
    );

    // ============ Modifiers ============
    
    modifier validAsset(string memory asset) {
        require(assetExists[asset], "Asset not supported");
        _;
    }

    modifier onlyPriceKeeper() {
        require(hasRole(PRICE_KEEPER_ROLE, msg.sender), "Only price keeper");
        _;
    }

    modifier notEmergencyMode(string memory asset) {
        require(!emergencyMode && !assetEmergencyMode[asset], "Emergency mode active");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(PRICE_KEEPER_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);
        
        // Initialize default market hours for major markets
        _initializeDefaultMarketHours();
    }

    // ============ Core Price Functions ============
    
    /**
     * @dev Gets current price for an asset
     * @param asset Asset symbol (e.g., "ETH", "AAPL", "EUR/USD")
     * @return price Current price in 18 decimals
     */
    function getPrice(string memory asset) external view validAsset(asset) returns (uint256) {
        PriceData memory priceData = currentPrices[asset];
        
        // Check if price is stale
        if (block.timestamp - priceData.timestamp > globalMaxStaleness) {
            // Return emergency price if available
            AssetConfig storage config = assetConfigs[asset];
            if (config.emergencyPrice > 0) {
                return config.emergencyPrice;
            }
            revert("Price too stale");
        }
        
        // Check confidence level
        require(priceData.confidence >= minimumConfidence, "Price confidence too low");
        
        return priceData.price;
    }

    /**
     * @dev Gets detailed price information
     * @param asset Asset symbol
     * @return priceData Detailed price information
     */
    function getPriceData(string memory asset) 
        external 
        view 
        validAsset(asset) 
        returns (PriceData memory) 
    {
        return currentPrices[asset];
    }

    /**
     * @dev Gets aggregated price information from all sources
     * @param asset Asset symbol
     * @return aggregated Aggregated price data
     */
    function getAggregatedPrice(string memory asset) 
        external 
        view 
        validAsset(asset) 
        returns (AggregatedPrice memory) 
    {
        return aggregatedPrices[asset];
    }

    /**
     * @dev Updates prices for a single asset
     * @param asset Asset symbol to update
     */
    function updateAssetPrice(string memory asset) 
        external 
        nonReentrant 
        validAsset(asset) 
        notEmergencyMode(asset) 
        whenNotPaused 
    {
        _updateAssetPrice(asset);
    }

    /**
     * @dev Updates prices for multiple assets
     * @param assets Array of asset symbols to update
     */
    function updateMultipleAssetPrices(string[] memory assets) 
        external 
        nonReentrant 
        onlyPriceKeeper 
        whenNotPaused 
    {
        uint256 updatedCount = 0;
        
        for (uint256 i = 0; i < assets.length; i++) {
            if (assetExists[assets[i]] && !emergencyMode && !assetEmergencyMode[assets[i]]) {
                _updateAssetPrice(assets[i]);
                updatedCount++;
            }
        }
        
        // Pay keeper reward if configured
        if (keeperReward > 0 && updatedCount > 0) {
            _payKeeperReward(msg.sender, updatedCount);
        }
    }

    // ============ Market Hours Functions ============
    
    /**
     * @dev Checks if market is currently open for an asset
     * @param asset Asset symbol
     * @return isOpen Whether market is currently open
     */
    function isMarketOpen(string memory asset) external view validAsset(asset) returns (bool) {
        MarketHours memory marketConfig = marketHours[asset];
        
        if (marketConfig.isAlwaysOpen) {
            return true; // 24/7 markets (crypto)
        }
        
        // Get current day of week (0 = Sunday)
        uint256 dayOfWeek = (block.timestamp / 1 days + 4) % 7;
        
        if (!marketConfig.tradingDays[dayOfWeek]) {
            return false; // Market closed today
        }
        
        // Get current time of day in seconds
        uint256 timeOfDay = block.timestamp % 1 days;
        
        return timeOfDay >= marketConfig.openTime && timeOfDay <= marketConfig.closeTime;
    }

    /**
     * @dev Sets market hours for an asset
     * @param asset Asset symbol
     * @param openTime Market open time (seconds from midnight UTC)
     * @param closeTime Market close time (seconds from midnight UTC)
     * @param tradingDays Array of trading days (0=Sunday, 6=Saturday)
     * @param isAlwaysOpen Whether market is 24/7
     * @param timezone Market timezone string
     */
    function setMarketHours(
        string memory asset,
        uint256 openTime,
        uint256 closeTime,
        bool[7] memory tradingDays,
        bool isAlwaysOpen,
        string memory timezone
    ) external onlyRole(OPERATOR_ROLE) validAsset(asset) {
        require(openTime < 86400 && closeTime < 86400, "Invalid time");
        require(openTime < closeTime, "Open time must be before close time");
        
        marketHours[asset] = MarketHours({
            openTime: openTime,
            closeTime: closeTime,
            tradingDays: tradingDays,
            isAlwaysOpen: isAlwaysOpen,
            timezone: timezone
        });
    }

    // ============ 24/7 Stock Price Functions - YOUR KILLER FEATURE! ============
    
    /**
     * @dev Special function for 24/7 stock price updates using synthetic pricing
     * This enables your killer feature: 24/7 stock options trading!
     * @param stockSymbol Stock symbol (e.g., "AAPL", "TSLA")
     * @param afterHoursMultiplier Multiplier for after-hours pricing adjustments
     * @param newsImpactFactor Factor for news-based price adjustments
     */
    function update24x7StockPrice(
        string memory stockSymbol,
        uint256 afterHoursMultiplier,
        uint256 newsImpactFactor
    ) external onlyPriceKeeper validAsset(stockSymbol) {
        AssetConfig storage config = assetConfigs[stockSymbol];
        require(config.assetType == AssetType.STOCK, "Not a stock asset");
        
        // Get base price from last market close
        uint256 basePrice = currentPrices[stockSymbol].price;
        
        // Apply after-hours adjustments if market is closed
        bool marketOpen = this.isMarketOpen(stockSymbol);
        if (!marketOpen) {
            // Use futures pricing, pre-market indicators, and news sentiment
            basePrice = _calculateAfterHoursPrice(
                stockSymbol,
                basePrice,
                afterHoursMultiplier,
                newsImpactFactor
            );
        }
        
        // Confidence is higher during market hours
        uint256 confidence = marketOpen ? 9000 : 7000; // Lower confidence after hours
        
        // Update with synthetic 24/7 price
        currentPrices[stockSymbol] = PriceData({
            price: basePrice,
            timestamp: block.timestamp,
            confidence: confidence,
            status: PriceStatus.ACTIVE,
            sourceCount: 1,
            deviation: 0
        });
        
        _updatePriceHistory(stockSymbol, basePrice);
        
        emit PriceUpdated(
            stockSymbol,
            basePrice,
            block.timestamp,
            confidence,
            1
        );
        
        emit SyntheticStockPriceUpdated(
            stockSymbol,
            basePrice,
            marketOpen,
            confidence
        );
    }

    /**
     * @dev Gets synthetic stock price with market status
     * @param stockSymbol Stock symbol
     * @return price Current synthetic price
     * @return isMarketHours Whether market is in trading hours
     * @return confidence Price confidence level
     */
    function getSyntheticStockPrice(string memory stockSymbol) 
        external 
        view 
        validAsset(stockSymbol) 
        returns (uint256 price, bool isMarketHours, uint256 confidence) 
    {
        require(assetConfigs[stockSymbol].assetType == AssetType.STOCK, "Not a stock");
        
        PriceData memory priceData = currentPrices[stockSymbol];
        bool marketOpen = this.isMarketOpen(stockSymbol);
        
        return (priceData.price, marketOpen, priceData.confidence);
    }

    /**
     * @dev Batch update for multiple stock prices with synthetic pricing
     * @param stockSymbols Array of stock symbols
     * @param afterHoursMultipliers Array of after-hours multipliers
     * @param newsImpactFactors Array of news impact factors
     */
    function batchUpdate24x7StockPrices(
        string[] memory stockSymbols,
        uint256[] memory afterHoursMultipliers,
        uint256[] memory newsImpactFactors
    ) external onlyPriceKeeper {
        require(
            stockSymbols.length == afterHoursMultipliers.length &&
            stockSymbols.length == newsImpactFactors.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < stockSymbols.length; i++) {
            if (assetExists[stockSymbols[i]] && 
                assetConfigs[stockSymbols[i]].assetType == AssetType.STOCK) {
                
                this.update24x7StockPrice(
                    stockSymbols[i],
                    afterHoursMultipliers[i],
                    newsImpactFactors[i]
                );
            }
        }
    }

    // ============ Asset Configuration ============
    
    /**
     * @dev Adds a new asset for price tracking
     * @param asset Asset symbol
     * @param assetType Type of asset (CRYPTO, FOREX, STOCK)
     * @param minSources Minimum sources required
     * @param maxDeviation Maximum allowed price deviation
     */
    function addAsset(
        string memory asset,
        AssetType assetType,
        uint256 minSources,
        uint256 maxDeviation
    ) external onlyRole(OPERATOR_ROLE) {
        require(!assetExists[asset], "Asset already exists");
        require(minSources >= MIN_SOURCES && minSources <= MAX_SOURCES, "Invalid min sources");
        require(maxDeviation <= MAX_PRICE_DEVIATION, "Deviation too high");
        
        AssetConfig storage config = assetConfigs[asset];
        config.assetType = assetType;
        config.symbol = asset;
        config.isActive = true;
        config.minSources = minSources;
        config.maxDeviation = maxDeviation;
        
        supportedAssets.push(asset);
        assetExists[asset] = true;
        
        // Initialize price data
        currentPrices[asset] = PriceData({
            price: 0,
            timestamp: 0,
            confidence: 0,
            status: PriceStatus.INVALID,
            sourceCount: 0,
            deviation: 0
        });
    }

    /**
     * @dev Adds a price source for an asset
     * @param asset Asset symbol
     * @param sourceType Type of price source
     * @param sourceAddress Address of the price source
     * @param weight Weight for weighted average (basis points)
     * @param maxStaleness Maximum staleness for this source
     * @param decimals Decimals of the price source
     * @param description Human readable description
     */
    function addPriceSource(
        string memory asset,
        SourceType sourceType,
        address sourceAddress,
        uint256 weight,
        uint256 maxStaleness,
        uint256 decimals,
        string memory description
    ) external onlyRole(OPERATOR_ROLE) validAsset(asset) {
        AssetConfig storage config = assetConfigs[asset];
        require(config.sources.length < MAX_SOURCES, "Too many sources");
        require(weight > 0 && weight <= 10000, "Invalid weight");
        require(maxStaleness <= MAX_STALENESS, "Staleness too high");
        require(sourceAddress != address(0), "Invalid source address");
        
        // Check if source already exists
        require(config.sourceIndex[sourceAddress] == 0, "Source already exists");
        
        PriceSource memory newSource = PriceSource({
            sourceType: sourceType,
            sourceAddress: sourceAddress,
            weight: weight,
            maxStaleness: maxStaleness,
            decimals: decimals,
            isActive: true,
            lastUpdateTime: 0,
            lastPrice: 0,
            description: description
        });
        
        config.sources.push(newSource);
        config.sourceIndex[sourceAddress] = config.sources.length; // 1-based index
        
        emit SourceAdded(asset, sourceAddress, sourceType, weight);
    }

    // ============ Internal Functions ============
    
    function _updateAssetPrice(string memory asset) internal {
        AssetConfig storage config = assetConfigs[asset];
        require(config.isActive, "Asset not active");
        
        // Collect prices from all active sources
        uint256[] memory prices = new uint256[](config.sources.length);
        uint256[] memory weights = new uint256[](config.sources.length);
        uint256 validSourceCount = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < config.sources.length; i++) {
            PriceSource storage source = config.sources[i];
            
            if (!source.isActive) continue;
            
            (bool success, uint256 price, uint256 updatedAt) = _fetchPriceFromSource(source);
            
            if (success && block.timestamp - updatedAt <= source.maxStaleness) {
                prices[validSourceCount] = price;
                weights[validSourceCount] = source.weight;
                totalWeight += source.weight;
                validSourceCount++;
                
                // Update source data
                source.lastPrice = int256(price);
                source.lastUpdateTime = updatedAt;
            }
        }
        
        require(validSourceCount >= config.minSources, "Insufficient valid sources");
        
        // Calculate aggregated price
        AggregatedPrice memory aggregated = _calculateAggregatedPrice(
            prices,
            weights,
            validSourceCount,
            totalWeight
        );
        
        // Validate price against previous value and deviation limits
        _validatePrice(asset, aggregated.weightedPrice, config.maxDeviation);
        
        // Calculate confidence score
        uint256 confidence = _calculateConfidence(validSourceCount, config.sources.length, aggregated);
        
        // Update current price
        currentPrices[asset] = PriceData({
            price: aggregated.weightedPrice,
            timestamp: block.timestamp,
            confidence: confidence,
            status: PriceStatus.ACTIVE,
            sourceCount: validSourceCount,
            deviation: _calculateDeviation(aggregated.minPrice, aggregated.maxPrice)
        });
        
        // Store aggregated data
        aggregatedPrices[asset] = aggregated;
        
        // Update price history
        _updatePriceHistory(asset, aggregated.weightedPrice);
        
        emit PriceUpdated(
            asset,
            aggregated.weightedPrice,
            block.timestamp,
            confidence,
            validSourceCount
        );
    }

    function _fetchPriceFromSource(PriceSource memory source) 
        internal 
        view 
        returns (bool success, uint256 price, uint256 updatedAt) 
    {
        if (source.sourceType == SourceType.CHAINLINK) {
            return _fetchChainlinkPrice(source);
        } else if (source.sourceType == SourceType.CUSTOM) {
            return _fetchCustomPrice(source);
        }
        // Add other source types as needed
        
        return (false, 0, 0);
    }

    function _fetchChainlinkPrice(PriceSource memory source) 
        internal 
        view 
        returns (bool success, uint256 price, uint256 updatedAt) 
    {
        try AggregatorV3Interface(source.sourceAddress).latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 _updatedAt,
            uint80
        ) {
            if (answer > 0) {
                // Convert to 18 decimals
                uint256 normalizedPrice = uint256(answer) * (10 ** (18 - source.decimals));
                return (true, normalizedPrice, _updatedAt);
            }
        } catch {
            return (false, 0, 0);
        }
        
        return (false, 0, 0);
    }

    function _fetchCustomPrice(PriceSource memory source) 
        internal 
        view 
        returns (bool success, uint256 price, uint256 updatedAt) 
    {
        // Fixed: Use interface-based approach instead of low-level call
        try ICustomOracle(source.sourceAddress).getPrice() returns (
            uint256 _price, 
            uint256 _updatedAt
        ) {
            if (_price > 0) {
                uint256 normalizedPrice = _price * (10 ** (18 - source.decimals));
                return (true, normalizedPrice, _updatedAt);
            }
        } catch {
            // Fallback to getLatestPrice if getPrice doesn't exist
            try ICustomOracle(source.sourceAddress).getLatestPrice() returns (uint256 _price) {
                if (_price > 0) {
                    uint256 normalizedPrice = _price * (10 ** (18 - source.decimals));
                    return (true, normalizedPrice, block.timestamp);
                }
            } catch {
                return (false, 0, 0);
            }
        }
        
        return (false, 0, 0);
    }

    function _calculateAggregatedPrice(
        uint256[] memory prices,
        uint256[] memory weights,
        uint256 validCount,
        uint256 totalWeight
    ) internal view returns (AggregatedPrice memory) {
        require(validCount > 0, "No valid prices");
        
        // Calculate weighted average
        uint256 weightedSum = 0;
        for (uint256 i = 0; i < validCount; i++) {
            weightedSum += prices[i] * weights[i];
        }
        uint256 weightedPrice = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        // Calculate median
        uint256[] memory sortedPrices = new uint256[](validCount);
        for (uint256 i = 0; i < validCount; i++) {
            sortedPrices[i] = prices[i];
        }
        _quickSort(sortedPrices, 0, int256(validCount - 1));
        
        uint256 medianPrice;
        if (validCount % 2 == 0) {
            medianPrice = (sortedPrices[validCount / 2 - 1] + sortedPrices[validCount / 2]) / 2;
        } else {
            medianPrice = sortedPrices[validCount / 2];
        }
        
        // Calculate average
        uint256 sum = 0;
        for (uint256 i = 0; i < validCount; i++) {
            sum += prices[i];
        }
        uint256 averagePrice = sum / validCount;
        
        // Find min and max
        uint256 minPrice = sortedPrices[0];
        uint256 maxPrice = sortedPrices[validCount - 1];
        
        return AggregatedPrice({
            weightedPrice: weightedPrice,
            medianPrice: medianPrice,
            averagePrice: averagePrice,
            minPrice: minPrice,
            maxPrice: maxPrice,
            validSources: validCount,
            totalWeight: totalWeight,
            lastUpdate: block.timestamp
        });
    }

    function _validatePrice(string memory asset, uint256 newPrice, uint256 maxDeviation) internal {
        PriceData memory currentPrice = currentPrices[asset];
        
        if (currentPrice.timestamp > 0 && currentPrice.price > 0) {
            uint256 deviation = _calculateDeviation(currentPrice.price, newPrice);
            
            if (deviation > maxDeviation) {
                emit PriceDeviation(asset, newPrice, currentPrice.price, deviation);
                
                // Trigger emergency mode if deviation is extreme
                if (deviation > emergencyThreshold) {
                    assetEmergencyMode[asset] = true;
                    revert("Price deviation too high");
                }
            }
        }
    }

    function _calculateConfidence(
        uint256 validSources,
        uint256 totalSources,
        AggregatedPrice memory aggregated
    ) internal pure returns (uint256) {
        // Base confidence from source availability
        uint256 sourceConfidence = (validSources * 5000) / totalSources; // Max 50%
        
        // Confidence from price consistency
        uint256 deviation = _calculateDeviation(aggregated.minPrice, aggregated.maxPrice);
        uint256 consistencyConfidence = deviation < 500 ? 5000 : (5000 - (deviation - 500) * 10); // Max 50%
        
        return Math.min(sourceConfidence + consistencyConfidence, 10000);
    }

    function _calculateDeviation(uint256 price1, uint256 price2) internal pure returns (uint256) {
        if (price1 == 0 || price2 == 0) return 0;
        
        uint256 diff = price1 > price2 ? price1 - price2 : price2 - price1;
        return (diff * 10000) / Math.max(price1, price2);
    }

    function _updatePriceHistory(string memory asset, uint256 price) internal {
        uint256[] storage history = priceHistory[asset];
        
        history.push(price);
        
        // Keep only last 24 prices
        if (history.length > 24) {
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
    }

    function _payKeeperReward(address keeper, uint256 assetsUpdated) internal {
        uint256 reward = keeperReward * assetsUpdated;
        
        if (keeperRewardToken != address(0) && reward > 0) {
            // Pay in ERC20 token
            IERC20(keeperRewardToken).transfer(keeper, reward);
        } else if (address(this).balance >= reward) {
            // Pay in ETH
            payable(keeper).transfer(reward);
        }
        
        emit KeeperRewardPaid(keeper, reward, assetsUpdated);
    }

    function _calculateAfterHoursPrice(
        string memory stockSymbol,
        uint256 basePrice,
        uint256 afterHoursMultiplier,
        uint256 newsImpactFactor
    ) internal view returns (uint256) {
        // Start with last market close price
        uint256 adjustedPrice = basePrice;
        
        // Apply after-hours multiplier (typically 0.95-1.05 for normal conditions)
        adjustedPrice = (adjustedPrice * afterHoursMultiplier) / PRECISION;
        
        // Apply news impact factor (could be from external news feeds)
        adjustedPrice = (adjustedPrice * newsImpactFactor) / PRECISION;
        
        // Add some time-based decay to prevent stale pricing
        uint256 timeSinceUpdate = block.timestamp - currentPrices[stockSymbol].timestamp;
        if (timeSinceUpdate > 4 hours) {
            // Gradually reduce confidence and add small random walk
            uint256 decay = Math.min(timeSinceUpdate / 1 hours, 10); // Max 10% decay
            adjustedPrice = (adjustedPrice * (100 - decay)) / 100;
        }
        
        // Ensure price doesn't deviate too much from base price
        uint256 maxDeviation = (basePrice * 500) / 10000; // 5% max deviation
        uint256 minPrice = basePrice - maxDeviation;
        uint256 maxPrice = basePrice + maxDeviation;
        
        if (adjustedPrice < minPrice) adjustedPrice = minPrice;
        if (adjustedPrice > maxPrice) adjustedPrice = maxPrice;
        
        return adjustedPrice;
    }

    function _quickSort(uint256[] memory arr, int256 left, int256 right) internal pure {
        if (left < right) {
            int256 pivot = _partition(arr, left, right);
            _quickSort(arr, left, pivot - 1);
            _quickSort(arr, pivot + 1, right);
        }
    }

    function _partition(uint256[] memory arr, int256 left, int256 right) internal pure returns (int256) {
        uint256 pivot = arr[uint256(right)];
        int256 i = left - 1;
        
        for (int256 j = left; j < right; j++) {
            if (arr[uint256(j)] <= pivot) {
                i++;
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
            }
        }
        
        (arr[uint256(i + 1)], arr[uint256(right)]) = (arr[uint256(right)], arr[uint256(i + 1)]);
        return i + 1;
    }

    function _initializeDefaultMarketHours() internal {
        // Initialize storage for market hours - this will be set via setMarketHours later
        // We can't initialize struct arrays directly in constructor due to storage limitations
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Sets emergency price for an asset
     * @param asset Asset symbol
     * @param price Emergency price
     * @param reason Reason for emergency price
     */
    function setEmergencyPrice(
        string memory asset,
        uint256 price,
        string memory reason
    ) external onlyRole(EMERGENCY_ROLE) validAsset(asset) {
        require(price > 0, "Invalid emergency price");
        
        AssetConfig storage config = assetConfigs[asset];
        config.emergencyPrice = price;
        config.emergencyTime = block.timestamp;
        
        assetEmergencyMode[asset] = true;
        
        emit EmergencyPriceSet(asset, price, reason);
    }

    /**
     * @dev Activates global emergency mode
     */
    function activateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = true;
        _pause();
    }

    /**
     * @dev Deactivates emergency mode for an asset
     * @param asset Asset symbol
     */
    function deactivateAssetEmergencyMode(string memory asset) 
        external 
        onlyRole(EMERGENCY_ROLE) 
        validAsset(asset) 
    {
        assetEmergencyMode[asset] = false;
        AssetConfig storage config = assetConfigs[asset];
        config.emergencyPrice = 0;
        config.emergencyTime = 0;
    }

    /**
     * @dev Deactivates global emergency mode
     */
    function deactivateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = false;
        _unpause();
    }

    // ============ View Functions ============
    
    /**
     * @dev Gets all supported assets
     * @return assets Array of supported asset symbols
     */
    function getSupportedAssets() external view returns (string[] memory) {
        return supportedAssets;
    }

    /**
     * @dev Gets price sources for an asset
     * @param asset Asset symbol
     * @return sources Array of price sources
     */
    function getAssetSources(string memory asset) 
        external 
        view 
        validAsset(asset) 
        returns (PriceSource[] memory) 
    {
        return assetConfigs[asset].sources;
    }

    /**
     * @dev Gets asset configuration
     * @param asset Asset symbol
     * @return assetType Type of asset
     * @return isActive Whether asset is active
     * @return minSources Minimum sources required
     * @return maxDeviation Maximum allowed deviation
     * @return sourceCount Number of configured sources
     */
    function getAssetConfig(string memory asset) 
        external 
        view 
        validAsset(asset) 
        returns (
            AssetType assetType,
            bool isActive,
            uint256 minSources,
            uint256 maxDeviation,
            uint256 sourceCount
        ) 
    {
        AssetConfig storage config = assetConfigs[asset];
        return (
            config.assetType,
            config.isActive,
            config.minSources,
            config.maxDeviation,
            config.sources.length
        );
    }

    /**
     * @dev Gets price history for an asset
     * @param asset Asset symbol
     * @return history Array of recent prices
     */
    function getPriceHistory(string memory asset) 
        external 
        view 
        validAsset(asset) 
        returns (uint256[] memory) 
    {
        return priceHistory[asset];
    }

    // ============ Circuit Breaker Functions ============
    
    /**
     * @dev Checks if any asset needs circuit breaker activation
     * @return needsBreaker Whether circuit breaker should activate
     * @return triggeredAssets Assets that triggered the check
     */
    function checkCircuitBreaker() 
        external 
        view 
        returns (bool needsBreaker, string[] memory triggeredAssets) 
    {
        string[] memory triggered = new string[](supportedAssets.length);
        uint256 triggeredCount = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            string memory asset = supportedAssets[i];
            PriceData memory priceData = currentPrices[asset];
            
            // Check for extreme volatility
            if (priceData.deviation > volatilityThreshold) {
                triggered[triggeredCount] = asset;
                triggeredCount++;
            }
        }
        
        // Create properly sized array
        string[] memory result = new string[](triggeredCount);
        for (uint256 i = 0; i < triggeredCount; i++) {
            result[i] = triggered[i];
        }
        
        return (triggeredCount > 0, result);
    }

    // ============ Analytics and Monitoring ============
    
    /**
     * @dev Gets oracle health metrics
     * @return totalAssets Number of supported assets
     * @return activeAssets Number of active assets
     * @return avgConfidence Average confidence across all assets
     * @return stalePrices Number of stale prices
     */
    function getOracleHealth() 
        external 
        view 
        returns (
            uint256 totalAssets,
            uint256 activeAssets,
            uint256 avgConfidence,
            uint256 stalePrices
        ) 
    {
        totalAssets = supportedAssets.length;
        uint256 totalConfidence = 0;
        stalePrices = 0;
        activeAssets = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            string memory asset = supportedAssets[i];
            
            if (assetConfigs[asset].isActive) {
                activeAssets++;
            }
            
            PriceData memory priceData = currentPrices[asset];
            totalConfidence += priceData.confidence;
            
            if (block.timestamp - priceData.timestamp > globalMaxStaleness) {
                stalePrices++;
            }
        }
        
        avgConfidence = totalAssets > 0 ? totalConfidence / totalAssets : 0;
        
        return (totalAssets, activeAssets, avgConfidence, stalePrices);
    }

    /**
     * @dev Batch get prices for multiple assets
     * @param assets Array of asset symbols
     * @return prices Array of current prices
     * @return timestamps Array of price timestamps
     */
    function getBatchPrices(string[] memory assets) 
        external 
        view 
        returns (uint256[] memory prices, uint256[] memory timestamps) 
    {
        prices = new uint256[](assets.length);
        timestamps = new uint256[](assets.length);
        
        for (uint256 i = 0; i < assets.length; i++) {
            if (assetExists[assets[i]]) {
                PriceData memory priceData = currentPrices[assets[i]];
                prices[i] = priceData.price;
                timestamps[i] = priceData.timestamp;
            }
        }
        
        return (prices, timestamps);
    }

    /**
     * @dev Special function to get 24/7 stock availability
     * Returns which stock assets can be traded 24/7 vs market hours only
     * @return alwaysAvailable Stocks available 24/7
     * @return marketHoursOnly Stocks limited to market hours
     */
    function getStockAvailability() 
        external 
        view 
        returns (string[] memory alwaysAvailable, string[] memory marketHoursOnly) 
    {
        string[] memory available = new string[](supportedAssets.length);
        string[] memory limited = new string[](supportedAssets.length);
        uint256 availableCount = 0;
        uint256 limitedCount = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            string memory asset = supportedAssets[i];
            
            if (assetConfigs[asset].assetType == AssetType.STOCK) {
                MarketHours memory _hours = marketHours[asset];
                
                if (_hours.isAlwaysOpen) {
                    available[availableCount] = asset;
                    availableCount++;
                } else {
                    limited[limitedCount] = asset;
                    limitedCount++;
                }
            }
        }
        
        // Create properly sized arrays
        string[] memory resultAvailable = new string[](availableCount);
        string[] memory resultLimited = new string[](limitedCount);
        
        for (uint256 i = 0; i < availableCount; i++) {
            resultAvailable[i] = available[i];
        }
        
        for (uint256 i = 0; i < limitedCount; i++) {
            resultLimited[i] = limited[i];
        }
        
        return (resultAvailable, resultLimited);
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Updates global oracle parameters
     * @param _updateInterval Update interval in seconds
     * @param _globalMaxStaleness Global maximum staleness
     * @param _minimumConfidence Minimum confidence required
     * @param _volatilityThreshold Volatility threshold for alerts
     * @param _emergencyThreshold Emergency threshold for auto-shutdown
     */
    function setOracleParameters(
        uint256 _updateInterval,
        uint256 _globalMaxStaleness,
        uint256 _minimumConfidence,
        uint256 _volatilityThreshold,
        uint256 _emergencyThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_updateInterval >= 60, "Update interval too short"); // Min 1 minute
        require(_globalMaxStaleness <= MAX_STALENESS, "Max staleness too high");
        require(_minimumConfidence <= 10000, "Invalid confidence");
        require(_volatilityThreshold <= 10000, "Invalid volatility threshold");
        require(_emergencyThreshold <= 10000, "Invalid emergency threshold");
        
        updateInterval = _updateInterval;
        globalMaxStaleness = _globalMaxStaleness;
        minimumConfidence = _minimumConfidence;
        volatilityThreshold = _volatilityThreshold;
        emergencyThreshold = _emergencyThreshold;
    }

    /**
     * @dev Sets keeper reward configuration
     * @param _keeperReward Reward amount per asset updated
     * @param _keeperRewardToken Token address for rewards (address(0) for ETH)
     */
    function setKeeperReward(uint256 _keeperReward, address _keeperRewardToken) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_keeperReward <= 1e18, "Keeper reward too high"); // Max 1 ETH per asset
        keeperReward = _keeperReward;
        keeperRewardToken = _keeperRewardToken;
    }

    /**
     * @dev Removes a price source
     * @param asset Asset symbol
     * @param sourceAddress Source address to remove
     */
    function removePriceSource(string memory asset, address sourceAddress) 
        external 
        onlyRole(OPERATOR_ROLE) 
        validAsset(asset) 
    {
        AssetConfig storage config = assetConfigs[asset];
        uint256 sourceIdx = config.sourceIndex[sourceAddress];
        require(sourceIdx > 0, "Source not found");
        
        // Convert to 0-based index
        sourceIdx--;
        
        // Remove from array by swapping with last element
        uint256 lastIdx = config.sources.length - 1;
        if (sourceIdx != lastIdx) {
            config.sources[sourceIdx] = config.sources[lastIdx];
            // Update index mapping for moved element
            config.sourceIndex[config.sources[sourceIdx].sourceAddress] = sourceIdx + 1;
        }
        
        config.sources.pop();
        delete config.sourceIndex[sourceAddress];
        
        emit SourceRemoved(asset, sourceAddress);
    }

    /**
     * @dev Updates source configuration
     * @param asset Asset symbol
     * @param sourceAddress Source address
     * @param weight New weight
     * @param maxStaleness New max staleness
     * @param isActive Whether source is active
     */
    function updateSourceConfig(
        string memory asset,
        address sourceAddress,
        uint256 weight,
        uint256 maxStaleness,
        bool isActive
    ) external onlyRole(OPERATOR_ROLE) validAsset(asset) {
        AssetConfig storage config = assetConfigs[asset];
        uint256 sourceIdx = config.sourceIndex[sourceAddress];
        require(sourceIdx > 0, "Source not found");
        
        PriceSource storage source = config.sources[sourceIdx - 1];
        require(weight <= 10000, "Invalid weight");
        require(maxStaleness <= MAX_STALENESS, "Staleness too high");
        
        source.weight = weight;
        source.maxStaleness = maxStaleness;
        source.isActive = isActive;
    }

    /**
     * @dev Toggles asset active status
     * @param asset Asset symbol
     * @param isActive Whether asset should be active
     */
    function setAssetActive(string memory asset, bool isActive) 
        external 
        onlyRole(OPERATOR_ROLE) 
        validAsset(asset) 
    {
        assetConfigs[asset].isActive = isActive;
    }

    /**
     * @dev Initialize default market hours for major assets
     * This function can be called after deployment to set up common market hours
     */
    function initializeDefaultMarketHours() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Crypto markets (24/7) - These will be set when assets are added
        // We'll add them programmatically as needed
        
        // US Stock Market (9:30 AM - 4:00 PM EST, Mon-Fri)
        bool[7] memory stockDays = [false, true, true, true, true, true, false]; // Mon-Fri
        
        // The actual initialization will happen when specific assets are added
        // This is a placeholder function for post-deployment setup
    }

    /**
     * @dev Set specific market hours for a stock to enable 24/7 trading
     * This is your killer feature enabler!
     * @param stockSymbol Stock symbol (e.g., "AAPL")
     * @param enable24x7 Whether to enable 24/7 trading for this stock
     */
    function setStock24x7Trading(
        string memory stockSymbol,
        bool enable24x7
    ) external onlyRole(OPERATOR_ROLE) validAsset(stockSymbol) {
        require(assetConfigs[stockSymbol].assetType == AssetType.STOCK, "Not a stock asset");
        
        if (enable24x7) {
            // Enable 24/7 trading
            marketHours[stockSymbol] = MarketHours({
                openTime: 0,
                closeTime: 86399,
                tradingDays: [true, true, true, true, true, true, true],
                isAlwaysOpen: true,
                timezone: "UTC"
            });
        } else {
            // Revert to standard market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
            marketHours[stockSymbol] = MarketHours({
                openTime: 50400, // 14:00 UTC (9:30 EST)
                closeTime: 73800, // 20:30 UTC (4:00 EST)
                tradingDays: [false, true, true, true, true, true, false],
                isAlwaysOpen: false,
                timezone: "EST"
            });
        }
    }

    // ============ Maintenance Functions ============
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenPaused 
    {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    // ============ Receive Function ============
    
    receive() external payable {
        // Accept ETH for keeper rewards
    }
}