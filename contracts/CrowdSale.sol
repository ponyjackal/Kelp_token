//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract CrowdSale is
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    // The token being sold
    IERC20Upgradeable public kelpToken;
    // Address where funds are collected
    address payable public wallet;
    // Amount of wei raised
    uint256 public weiRaised;

    struct SaleInfo {
        uint256 rate;
        uint256 startTime;
        uint256 limitPerAccount;
        uint256 totalLimit;
        bool paused;
    }
    /**
     * Sales array
     * 0 -> privateSale
     * 1 -> preSale
     */
    SaleInfo[] public sales;
    mapping(uint256 => mapping(address => uint256)) public purchases;
    mapping(uint256 => uint256) public totalSales;

    // -----------------------------------------
    // Crowdsale Events
    // -----------------------------------------

    /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );
    /**
     * Event for adding new sale
     * @param rate The rate for token sale
     * @param startTime The token sale start time
     * @param limitPerAccount The limit per account for token sale
     * @param totalLimit The limit of total token sale
     * @param paused The status of token sale
     */
    event SaleAdded(
        uint256 rate,
        uint256 startTime,
        uint256 limitPerAccount,
        uint256 totalLimit,
        bool paused
    );
    /**
     * Event for adding new sale
     * @param saleType The token sale type
     * @param rate The rate for token sale
     * @param startTime The token sale start time
     * @param limitPerAccount The limit per account for token sale
     * @param totalLimit The limit of total token sale
     * @param paused The status of token sale
     */
    event SaleUpdated(
        uint256 saleType,
        uint256 rate,
        uint256 startTime,
        uint256 limitPerAccount,
        uint256 totalLimit,
        bool paused
    );
    /**
     * Event for updating wallet address
     * @param oldWallet New wallet address
     * @param newWallet New wallet address
     */
    event WalletUpdated(address oldWallet, address newWallet);

    // -----------------------------------------
    // Crowdsale Initializer
    // -----------------------------------------

    /**
     * @dev Initializer function
     * @param _kelpToken The Kelp token
     */
    function initialize(IERC20Upgradeable _kelpToken, address payable _wallet)
        external
        initializer
    {
        __Context_init();
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        require(address(_kelpToken) != address(0), "invalid kelp address");
        require(_wallet != address(0), "invalid kelp address");

        kelpToken = _kelpToken;
        wallet = _wallet;
    }

    // -----------------------------------------
    // Crowdsale Owner Setters
    // -----------------------------------------
    /**
     * @dev add new sale info
     * @param _rate The rate of token sale
     * @param _startTime The sale start time
     * @param _limtPerAccount The limit of token sale per account
     * @param _totalLimit The total limit of token sale
     * @param _paused The status of token sale
     */
    function addSaleInfo(
        uint256 _rate,
        uint256 _startTime,
        uint256 _limtPerAccount,
        uint256 _totalLimit,
        bool _paused
    ) external onlyOwner {
        require(_rate != 0, "invalid rate");
        require(
            _startTime >= block.timestamp,
            "can't set startTime in the past"
        );
        require(_totalLimit != 0, "invalid total limit");

        SaleInfo memory newSaleInfo = SaleInfo(
            _rate,
            _startTime,
            _limtPerAccount,
            _totalLimit,
            _paused
        );
        // add sale info
        sales.push(newSaleInfo);
        emit SaleAdded(
            _rate,
            _startTime,
            _limtPerAccount,
            _totalLimit,
            _paused
        );
    }

    /**
     * @dev update sale info
     * @param _type The type of sale
     * @param _rate The rate of token sale
     * @param _startTime The sale start time
     * @param _limtPerAccount The limit of token sale per account
     * @param _totalLimit The total limit of token sale
     * @param _paused The status of token sale
     */
    function updateSaleInfo(
        uint256 _type,
        uint256 _rate,
        uint256 _startTime,
        uint256 _limtPerAccount,
        uint256 _totalLimit,
        bool _paused
    ) external onlyOwner {
        require(_rate != 0, "invalid rate");
        require(
            _startTime >= block.timestamp,
            "can't set startTime in the past"
        );
        require(_totalLimit != 0, "invalid total limit");

        SaleInfo memory newSaleInfo = SaleInfo(
            _rate,
            _startTime,
            _limtPerAccount,
            _totalLimit,
            _paused
        );
        // update sale info
        sales[_type] = newSaleInfo;
        emit SaleUpdated(
            _type,
            _rate,
            _startTime,
            _limtPerAccount,
            _totalLimit,
            _paused
        );
    }

    /**
     * @dev update wallet address
     * @param _wallet The type of sale
     */
    function updateWallet(address payable _wallet) external onlyOwner {
        require(_wallet != address(0), "invalid address");
        address oldWallet = wallet;
        wallet = _wallet;

        emit WalletUpdated(oldWallet, wallet);
    }

    /**
     * @dev update sale info
     * @param _type The type of sale
     * @param _paused The status of token sale
     */
    function pauseSale(uint256 _type, bool _paused) external onlyOwner {
        require(_type < sales.length, "invalid type");

        SaleInfo storage sale = sales[_type];
        // update sale info
        sale.paused = _paused;
    }

    // -----------------------------------------
    // Crowdsale external getters
    // -----------------------------------------
    /**
     * @dev return token sale rate
     * @param _type The type of sale
     */
    function getRate(uint256 _type) external view returns (uint256) {
        require(_type < sales.length, "invalid type");
        return sales[_type].rate;
    }

    /**
     * @dev return token sale limit per account
     * @param _type The type of sale
     */
    function getStartTime(uint256 _type) external view returns (uint256) {
        require(_type < sales.length, "invalid type");
        return sales[_type].startTime;
    }

    /**
     * @dev return token sale limit per account
     * @param _type The type of sale
     */
    function getLimitPerAccount(uint256 _type) external view returns (uint256) {
        require(_type < sales.length, "invalid type");
        return sales[_type].limitPerAccount;
    }

    /**
     * @dev return token sale limit per account
     * @param _type The type of sale
     */
    function getTotalLimit(uint256 _type) external view returns (uint256) {
        require(_type < sales.length, "invalid type");
        return sales[_type].totalLimit;
    }

    /**
     * @dev return token sale pause status
     * @param _type The type of sale
     */
    function isPaused(uint256 _type) external view returns (bool) {
        require(_type < sales.length, "invalid type");
        return sales[_type].paused;
    }

    // -----------------------------------------
    // Crowdsale external interface
    // -----------------------------------------

    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     */
    fallback() external payable {
        buyActiveSaleTokens(msg.sender);
    }

    /**
     * @dev receive function ***DO NOT OVERRIDE***
     */
    receive() external payable {
        buyActiveSaleTokens(msg.sender);
    }

    /**
     * @dev buy tokens for current active sale
     * @param _beneficiary Address performing the token purchase
     */
    function buyActiveSaleTokens(address _beneficiary) public payable {
        uint256 activeSaleType = _getActiveSaleType();
        require(activeSaleType < sales.length, "no active sales");

        buyTokens(_beneficiary, activeSaleType);
    }

    /**
     * @dev low level private token purchase ***DO NOT OVERRIDE***
     * @param _beneficiary Address performing the token purchase
     * @param _type Type of sale
     */
    function buyTokens(address _beneficiary, uint256 _type) public payable {
        uint256 weiAmount = msg.value;

        require(_type < sales.length, "invalid sale");
        require(_beneficiary != address(0), "invalid address");
        require(weiAmount != 0, "insufficient amount");
        require(!sales[_type].paused, "Sale is paused");
        require(
            block.timestamp >= sales[_type].startTime,
            "PrivateSale is not started yet"
        );

        // calculate sale token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount, _type);
        // update total sales
        totalSales[_type] = totalSales[_type].add(tokens);
        require(
            totalSales[_type] <= sales[_type].totalLimit,
            "Total Sale limit exceeds"
        );
        // update personal purchased amount
        purchases[_type][_beneficiary] = purchases[_type][_beneficiary].add(
            tokens
        );
        require(
            sales[_type].limitPerAccount != 0 &&
                purchases[_type][_beneficiary] <= sales[_type].limitPerAccount,
            "Purchase limit exceeds"
        );
        // update wei raised state
        weiRaised = weiRaised.add(weiAmount);
        // deliver tokens
        _deliverTokens(_beneficiary, tokens);
        emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

        _forwardFunds();
    }

    // -----------------------------------------
    // Crowdsale internal interface
    // -----------------------------------------

    /**
     * @dev Source of tokens.
     * @param _beneficiary Address performing the token purchase
     * @param _tokenAmount Number of tokens to be emitted
     */
    function _deliverTokens(address _beneficiary, uint256 _tokenAmount)
        internal
    {
        kelpToken.transfer(_beneficiary, _tokenAmount);
    }

    /**
     * @dev get private sale token amount
     * @param _weiAmount Amount of wei to purchase
     * @param _type The type of token sale
     */
    function _getTokenAmount(uint256 _weiAmount, uint256 _type)
        internal
        view
        returns (uint256)
    {
        return _weiAmount.mul(sales[_type].rate);
    }

    /**
     * @dev get active sale
     */
    function _getActiveSaleType() internal view returns (uint256) {
        for (uint256 i = 0; i < sales.length; i++) {
            if (!sales[i].paused) {
                return i;
            }
        }

        return sales.length;
    }

    /**
     * @dev Determines how ETH is stored/forwarded on purchases.
     */
    function _forwardFunds() internal {
        wallet.transfer(msg.value);
    }
}
