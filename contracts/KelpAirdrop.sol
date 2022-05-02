// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IKelpToken.sol";
import "./Proxyable.sol";

/**
 * @title KELP token initial distribution
 *
 * @dev Distribute purchasers, airdrop, reserve, and founder tokens
 */
contract KelpAirdrop is Proxyable {
    using SafeMath for uint256;

    IKelpToken public immutable KELP;

    uint256 private constant decimalFactor = 10**18;
    uint256 public constant INITIAL_SUPPLY = 1000000000 * decimalFactor;
    uint256 public AVAILABLE_TOTAL_SUPPLY = 1000000000 * decimalFactor;
    uint256 public AVAILABLE_PRESALE_SUPPLY = 230000000 * decimalFactor; // 100% Released at Token Distribution (TD)
    uint256 public AVAILABLE_FOUNDER_SUPPLY = 150000000 * decimalFactor; // 33% Released at TD +1 year -> 100% at TD +3 years
    uint256 public AVAILABLE_AIRDROP_SUPPLY = 10000000 * decimalFactor; // 100% Released at TD
    uint256 public AVAILABLE_ADVISOR_SUPPLY = 20000000 * decimalFactor; // 100% Released at TD +7 months
    uint256 public AVAILABLE_RESERVE_SUPPLY = 513116658 * decimalFactor; // 6.8% Released at TD +100 days -> 100% at TD +4 years
    uint256 public AVAILABLE_BONUS1_SUPPLY = 39053330 * decimalFactor; // 100% Released at TD +1 year
    uint256 public AVAILABLE_BONUS2_SUPPLY = 9354408 * decimalFactor; // 100% Released at TD +2 years
    uint256 public AVAILABLE_BONUS3_SUPPLY = 28475604 * decimalFactor; // 100% Released at TD +3 years

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
        uint256 AllocationSupply; // Type of allocation
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
        require(msg.sender == owner() || airdropAdmins[msg.sender]);
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

    /**
     * @dev Constructor function - Set the kelp token address
     * @param _startTime The time when KelpAirdrop goes live
     */
    constructor(
        address _proxy,
        uint256 _startTime,
        IKelpToken _kelp
    ) Proxyable(payable(_proxy)) {
        require(
            _startTime >= block.timestamp,
            "Start time can't be in the past"
        );
        require(address(_kelp) != address(0), "invalid Kelp address");

        startTime = _startTime;
        KELP = _kelp;
    }

    /**
     * @dev Allow the owner of the contract to assign a new presale allocation
     * @param _recipient The recipient of the allocation
     * @param _totalAllocated The total amount of KELP available to the receipient (after vesting)
     */
    function setPresaleAllocation(address _recipient, uint256 _totalAllocated)
        external
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_PRESALE_SUPPLY = AVAILABLE_PRESALE_SUPPLY.sub(
            _totalAllocated
        );
        allocations[_recipient] = Allocation(
            uint8(AllocationType.PRESALE),
            0,
            0,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_FOUNDER_SUPPLY = AVAILABLE_FOUNDER_SUPPLY.sub(
            _totalAllocated
        );
        allocations[_recipient] = Allocation(
            uint8(AllocationType.FOUNDER),
            startTime + 1 * 365 days,
            startTime + 3 * 365 days,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_ADVISOR_SUPPLY = AVAILABLE_ADVISOR_SUPPLY.sub(
            _totalAllocated
        );
        allocations[_recipient] = Allocation(
            uint8(AllocationType.ADVISOR),
            startTime + 209 days,
            0,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_RESERVE_SUPPLY = AVAILABLE_RESERVE_SUPPLY.sub(
            _totalAllocated
        );
        allocations[_recipient] = Allocation(
            uint8(AllocationType.RESERVE),
            startTime + 100 days,
            startTime + 4 * 365 days,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_BONUS1_SUPPLY = AVAILABLE_BONUS1_SUPPLY.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.BONUS1),
            startTime + 1 * 365 days,
            startTime + 1 * 365 days,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_BONUS2_SUPPLY = AVAILABLE_BONUS2_SUPPLY.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.BONUS2),
            startTime + 2 * 365 days,
            startTime + 2 * 365 days,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
        onlyOwner
    {
        require(_totalAllocated > 0, "invalid totalAllocated");
        require(
            allocations[_recipient].totalAllocated == 0,
            "recipient already allocated"
        );
        require(_recipient != address(0), "invalid recipient address");

        AVAILABLE_BONUS3_SUPPLY = AVAILABLE_BONUS3_SUPPLY.sub(_totalAllocated);
        allocations[_recipient] = Allocation(
            uint8(AllocationType.BONUS3),
            startTime + 3 * 365 days,
            startTime + 3 * 365 days,
            _totalAllocated,
            0
        );

        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
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
    function setAirdropAdmin(address _admin, bool _isAdmin) external onlyOwner {
        airdropAdmins[_admin] = _isAdmin;
    }

    /**
     * @dev perform a transfer of allocations
     * @param _recipient is a list of recipients
     */
    function airdropTokens(address[] memory _recipient)
        public
        onlyOwnerOrAdmin
    {
        require(block.timestamp >= startTime);
        uint256 airdropped;
        for (uint256 i = 0; i < _recipient.length; i++) {
            if (!airdrops[_recipient[i]]) {
                airdrops[_recipient[i]] = true;
                require(KELP.transfer(_recipient[i], 250 * decimalFactor));
                airdropped = airdropped.add(250 * decimalFactor);
            }
        }
        AVAILABLE_AIRDROP_SUPPLY = AVAILABLE_AIRDROP_SUPPLY.sub(airdropped);
        AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(airdropped);
        grandTotalClaimed = grandTotalClaimed.add(airdropped);
    }

    /**
     * @dev Transfer a recipients available allocation to their address
     * @param _recipient The address to withdraw tokens for
     */
    function transferTokens(address _recipient) public {
        require(
            allocations[_recipient].amountClaimed <
                allocations[_recipient].totalAllocated
        );
        require(block.timestamp >= allocations[_recipient].endCliff);
        require(block.timestamp >= startTime);
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
        require(KELP.transfer(_recipient, tokensToTransfer));
        grandTotalClaimed = grandTotalClaimed.add(tokensToTransfer);
        emit LogKelpClaimed(
            _recipient,
            allocations[_recipient].AllocationSupply,
            tokensToTransfer,
            newAmountClaimed,
            grandTotalClaimed
        );
    }

    // Returns the amount of KELP allocated
    function grandTotalAllocated() public view returns (uint256) {
        return INITIAL_SUPPLY - AVAILABLE_TOTAL_SUPPLY;
    }

    // Allow transfer of accidentally sent ERC20 tokens
    function refundTokens(address _recipient, address _token) public onlyOwner {
        require(_token != address(KELP));
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(_recipient, balance));
    }
}
