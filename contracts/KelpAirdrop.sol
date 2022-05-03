// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Proxyable.sol";

/**
 * @title KELP token initial distribution
 *
 * @dev Distribute purchasers, airdrop, reserve, and founder tokens
 */
contract KelpAirdrop is Proxyable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public kelpToken;

    uint256 private constant decimalFactor = 10**18;
    uint256 public constant INITIAL_SUPPLY = 1000000000 * decimalFactor;
    uint256 public availableTotalSupply = 1000000000 * decimalFactor;
    uint256 public availablePresaleSupply = 230000000 * decimalFactor; // 100% Released at Token Distribution (TD)
    // 33% Released at TD +1 year -> 100% at TD +3 years
    uint256 public availableFounderSupply = 150000000 * decimalFactor;
    uint256 public availableAirdropSupply = 10000000 * decimalFactor; // 100% Released at TD
    uint256 public availableAdvisorSupply = 20000000 * decimalFactor; // 100% Released at TD +7 months
    // 6.8% Released at TD +100 days -> 100% at TD +4 years
    uint256 public availableReserveSupply = 513116658 * decimalFactor;
    uint256 public availableBonus1Supply = 39053330 * decimalFactor; // 100% Released at TD +1 year
    uint256 public availableBonus2Supply = 9354408 * decimalFactor; // 100% Released at TD +2 years
    uint256 public availableBonus3Supply = 28475604 * decimalFactor; // 100% Released at TD +3 years

    uint256 public grandTotalClaimed = 0;
    uint256 public startTime;

    enum AllocationType {
        PRESALE,
        FOUNDER,
        AIRDROP,
        ADVISOR,
        RESERVE,
        BONUS1,
        BONUS2,
        BONUS3
    }

    // Allocation with vesting information
    struct Allocation {
        uint256 allocationSupply; // Type of allocation
        uint256 endCliff; // Tokens are locked until
        uint256 endVesting; // This is when the tokens are fully unvested
        uint256 totalAllocated; // Total tokens allocated
        uint256 amountClaimed; // Total tokens claimed
    }
    mapping(address => Allocation) public allocations;

    // List of admins
    mapping(address => bool) public airdropAdmins;

    // Keeps track of whether or not a 250 KELP airdrop has been made to a particular address
    mapping(address => bool) public airdrops;

    modifier onlyOwnerOrAdmin() {
        require(
            msg.sender == owner() || airdropAdmins[msg.sender],
            "should be owner or admin"
        );
        _;
    }

    event LogNewAllocation(
        address indexed _recipient,
        AllocationType indexed _fromSupply,
        uint256 _totalAllocated,
        uint256 _grandTotalAllocated
    );
    event LogKelpClaimed(
        address indexed _recipient,
        uint256 indexed _fromSupply,
        uint256 _amountClaimed,
        uint256 _totalAllocated,
        uint256 _grandTotalClaimed
    );
    event LogKelpUpdated(address _oldToken, address _newToken);
    event LogStartTimeUpdated(uint256 _startTime);

    /**
     * @dev Constructor function - Set the kelp token address
     * @param _startTime The time when KelpAirdrop goes live
     */
    constructor(
        address _proxy,
        uint256 _startTime,
        IERC20 _kelpToken
    ) Proxyable(payable(_proxy)) {
        startTime = _startTime;
        kelpToken = _kelpToken;
    }

    /**
     * @dev Update Kelp token
     * @param _kelpToken The Token address of new Kelp
     */
    function setKelpToken(address _kelpToken) external optionalProxy_onlyOwner {
        require(_kelpToken != address(0), "invalid Kelp address");

        address oldKelp = address(kelpToken);
        kelpToken = IERC20(_kelpToken);

        emit LogKelpUpdated(oldKelp, _kelpToken);
    }

    /**
     * @dev Update Airdrop start time
     * @param _startTime The Token address of new Kelp
     */
    function setStartTime(uint256 _startTime) external optionalProxy_onlyOwner {
        require(
            _startTime >= block.timestamp,
            "Start time can't be in the past"
        );
        startTime = _startTime;

        emit LogStartTimeUpdated(_startTime);
    }

    /**
     * @dev Allow the owner of the contract to assign a new presale allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setPresaleAllocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availablePresaleSupply = availablePresaleSupply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.PRESALE),
            0,
            0,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.PRESALE,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Allow the owner of the contract to assign a new founder allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setFounderAllocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availableFounderSupply = availableFounderSupply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.FOUNDER),
            startTime + 1 * 365 days,
            startTime + 3 * 365 days,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.FOUNDER,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Allow the owner of the contract to assign a new advisor allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setAdvisorAllocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availableAdvisorSupply = availableAdvisorSupply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.ADVISOR),
            startTime + 209 days,
            0,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.ADVISOR,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Allow the owner of the contract to assign a new reserve allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setReserveAllocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availableReserveSupply = availableReserveSupply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.RESERVE),
            startTime + 100 days,
            startTime + 4 * 365 days,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.RESERVE,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Allow the owner of the contract to assign a new bonus1 allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setBonus1Allocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availableBonus1Supply = availableBonus1Supply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.BONUS1),
            startTime + 1 * 365 days,
            startTime + 1 * 365 days,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.BONUS1,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Allow the owner of the contract to assign a new bonus2 allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setBonus2Allocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availableBonus2Supply = availableBonus2Supply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.BONUS2),
            startTime + 2 * 365 days,
            startTime + 2 * 365 days,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.BONUS2,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Allow the owner of the contract to assign a new bonus3 allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setBonus3Allocation(address _recipient, uint256 _totalAllocated)
        external
        optionalProxy_onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        availableBonus3Supply = availableBonus3Supply.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.BONUS3),
            startTime + 3 * 365 days,
            startTime + 3 * 365 days,
            _totalAllocated,
            0
        );

        availableTotalSupply = availableTotalSupply.sub(_totalAllocated);
        emit LogNewAllocation(
            _recipient,
            AllocationType.BONUS3,
            _totalAllocated,
            grandTotalAllocated()
        );
    }

    /**
     * @dev Add an airdrop admin
     */
    function setAirdropAdmin(address _admin, bool _isAdmin)
        external
        optionalProxy_onlyOwner
    {
        airdropAdmins[_admin] = _isAdmin;
    }

    /**
     * @dev perform a transfer of allocations
     * @param _recipient is a list of recipients
     */
    function airdropTokens(address[] memory _recipient)
        public
        onlyOwnerOrAdmin
        nonReentrant
    {
        require(block.timestamp >= startTime, "airdrop not started");
        uint256 airdropped;

        availableAirdropSupply = availableAirdropSupply.sub(airdropped);
        availableTotalSupply = availableTotalSupply.sub(airdropped);
        grandTotalClaimed = grandTotalClaimed.add(airdropped);

        for (uint256 i = 0; i < _recipient.length; i++) {
            if (!airdrops[_recipient[i]]) {
                airdrops[_recipient[i]] = true;
                kelpToken.safeTransfer(_recipient[i], 250 * decimalFactor);
                airdropped = airdropped.add(250 * decimalFactor);
            }
        }
    }

    /**
     * @dev Transfer a recipients available allocation to their address
     * @param _recipient The address to withdraw tokens for
     */
    function transferTokens(address _recipient)
        external
        optionalProxy
        nonReentrant
    {
        require(
            allocations[_recipient].amountClaimed <
                allocations[_recipient].totalAllocated,
            "insuffcient amount"
        );
        require(
            block.timestamp >= allocations[_recipient].endCliff,
            "still in lock"
        );
        require(block.timestamp >= startTime, "not started yet");

        uint256 newAmountClaimed;
        if (allocations[_recipient].endVesting > block.timestamp) {
            // Transfer available amount based on vesting schedule and allocation
            newAmountClaimed = allocations[_recipient]
                .totalAllocated
                .mul(block.timestamp.sub(startTime))
                .div(allocations[_recipient].endVesting.sub(startTime));
        } else {
            // Transfer total allocated (minus previously claimed tokens)
            newAmountClaimed = allocations[_recipient].totalAllocated;
        }
        uint256 tokensToTransfer = newAmountClaimed.sub(
            allocations[_recipient].amountClaimed
        );
        allocations[_recipient].amountClaimed = newAmountClaimed;

        grandTotalClaimed = grandTotalClaimed.add(tokensToTransfer);

        kelpToken.safeTransfer(_recipient, tokensToTransfer);

        emit LogKelpClaimed(
            _recipient,
            allocations[_recipient].allocationSupply,
            tokensToTransfer,
            newAmountClaimed,
            grandTotalClaimed
        );
    }

    // Returns the amount of KELP allocated
    function grandTotalAllocated() public view returns (uint256) {
        return INITIAL_SUPPLY - availableTotalSupply;
    }

    // Allow transfer of accidentally sent ERC20 tokens
    function refundTokens(address _recipient, address _token)
        external
        optionalProxy_onlyOwner
    {
        require(_token != address(kelpToken), "invalid token address");
        require(_recipient != address(0), "invalid address");

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(_recipient, balance);
    }
}
