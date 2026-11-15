// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./RoyaltySplitter.sol";

/**
 * @title PaymentVault
 * @dev Secure non-custodial pull-payment escrow vault.
 *      Tracks withdrawable balances per user per token and supports batch withdrawals.
 * @custom:project RoyaltyFlow (project_h15)
 */
contract PaymentVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Roles ---

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // --- State Variables ---

    RoyaltySplitter public immutable royaltySplitter;

    // tokenAddress => (userAddress => balance)
    // tokenAddress == address(0) represents native AVAX/ETH
    mapping(address => mapping(address => uint256)) public pendingBalances;

    // contentId => (tokenAddress => totalRevenue)
    mapping(uint256 => mapping(address => uint256)) public totalContentRevenue;

    // --- Events ---

    event RevenueCredited(
        uint256 indexed contentId,
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    event Withdrawn(
        address indexed token,
        address indexed user,
        uint256 amount
    );

    // --- Errors ---

    error ZeroAmount();
    error NativeValueMismatch(uint256 expected, uint256 actual);
    error NoWithdrawableBalance();
    error NativeTransferFailed();

    // --- Constructor ---

    constructor(address royaltySplitterAddress, address initialAdmin) {
        require(royaltySplitterAddress != address(0), "Invalid RoyaltySplitter address");
        require(initialAdmin != address(0), "Invalid initial admin");

        royaltySplitter = RoyaltySplitter(royaltySplitterAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(OPERATOR_ROLE, initialAdmin);
    }

    // --- Receive native tokens ---

    receive() external payable {}

    // --- External Functions ---

    /**
     * @notice Credits revenue from a license purchase according to the RoyaltySplitter rules.
     * @dev Only addresses with OPERATOR_ROLE (such as LicenseManager) can call this.
     * @param contentId Content ID receiving revenue.
     * @param token Address of payment token (address(0) for native AVAX).
     * @param amount Total amount paid.
     */
    function creditRevenue(
        uint256 contentId,
        address token,
        uint256 amount
    ) external payable onlyRole(OPERATOR_ROLE) {
        if (amount == 0) revert ZeroAmount();

        if (token == address(0)) {
            if (msg.value != amount) {
                revert NativeValueMismatch(amount, msg.value);
            }
        }

        totalContentRevenue[contentId][token] += amount;

        (address[] memory targets, uint256[] memory amounts) = royaltySplitter.calculateSplits(
            contentId,
            amount
        );

        for (uint256 i = 0; i < targets.length; i++) {
            if (amounts[i] > 0) {
                pendingBalances[token][targets[i]] += amounts[i];
                emit RevenueCredited(contentId, token, targets[i], amounts[i]);
            }
        }
    }

    /**
     * @notice Pull payment: withdraws total available balance for a specific token to caller.
     * @param token Token address (address(0) for native AVAX).
     */
    function withdraw(address token) external nonReentrant {
        uint256 balance = pendingBalances[token][msg.sender];
        if (balance == 0) revert NoWithdrawableBalance();

        pendingBalances[token][msg.sender] = 0;

        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: balance}("");
            if (!success) revert NativeTransferFailed();
        } else {
            IERC20(token).safeTransfer(msg.sender, balance);
        }

        emit Withdrawn(token, msg.sender, balance);
    }

    /**
     * @notice Pull payment: withdraws balances for multiple tokens in a single transaction.
     * @param tokens Array of token addresses.
     */
    function withdrawBatch(address[] calldata tokens) external nonReentrant {
        bool hasWithdrawnAny = false;

        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 balance = pendingBalances[token][msg.sender];

            if (balance > 0) {
                pendingBalances[token][msg.sender] = 0;
                hasWithdrawnAny = true;

                if (token == address(0)) {
                    (bool success, ) = payable(msg.sender).call{value: balance}("");
                    if (!success) revert NativeTransferFailed();
                } else {
                    IERC20(token).safeTransfer(msg.sender, balance);
                }

                emit Withdrawn(token, msg.sender, balance);
            }
        }

        if (!hasWithdrawnAny) revert NoWithdrawableBalance();
    }

    // --- View Functions ---

    /**
     * @notice Queries pending withdrawable balance for a user.
     * @param token Payment token (address(0) for AVAX).
     * @param user User wallet address.
     */
    function getPendingBalance(address token, address user) external view returns (uint256) {
        return pendingBalances[token][user];
    }

    /**
     * @notice Queries cumulative historical revenue for a content item.
     * @param contentId Content ID.
     * @param token Payment token.
     */
    function getTotalContentRevenue(uint256 contentId, address token) external view returns (uint256) {
        return totalContentRevenue[contentId][token];
    }
}
