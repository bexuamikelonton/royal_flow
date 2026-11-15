// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ContentRegistry.sol";

/**
 * @title RoyaltySplitter
 * @dev Manages revenue split rules based on Basis Points (10,000 BPS = 100%) and
 *      implements cascading upstream distributions for the Derivative Royalty Graph (DAG).
 * @custom:project RoyaltyFlow (project_h15)
 */
contract RoyaltySplitter is Ownable {
    // --- Constants ---

    uint256 public constant BPS_DENOMINATOR = 10_000; // 100.00%
    uint256 public constant MAX_GRAPH_DEPTH = 5;

    // --- Data Structures ---

    struct SplitRule {
        address[] recipients;
        uint256[] bpsShares;   // Sum must equal 10,000 BPS
        uint256 upstreamBps;   // Percentage routed to parent content (if derivative)
        bool isLocked;         // Immutable once locked by consensus/HITL
        bool isConfigured;
    }

    // --- State Variables ---

    ContentRegistry public immutable contentRegistry;
    mapping(uint256 => SplitRule) private _splitRules;

    // --- Events ---

    event SplitsConfigured(
        uint256 indexed contentId,
        address[] recipients,
        uint256[] bpsShares,
        uint256 upstreamBps
    );

    event SplitsLocked(uint256 indexed contentId);

    // --- Errors ---

    error ContentNotRegistered(uint256 contentId);
    error ContentIsFrozen(uint256 contentId);
    error UnauthorizedSplitCaller(uint256 contentId, address caller);
    error SplitsAlreadyLocked(uint256 contentId);
    error SplitsNotConfigured(uint256 contentId);
    error EmptyRecipients();
    error ArrayLengthMismatch();
    error InvalidRecipientAddress();
    error InvalidTotalBPS(uint256 totalBps);
    error InvalidUpstreamBPS(uint256 upstreamBps);
    error UpstreamNotAllowedForRootContent();
    error MaxGraphDepthExceeded(uint256 depth);
    error CycleDetected(uint256 contentId);

    // --- Constructor ---

    constructor(address contentRegistryAddress, address initialOwner) Ownable(initialOwner) {
        require(contentRegistryAddress != address(0), "Invalid ContentRegistry address");
        contentRegistry = ContentRegistry(contentRegistryAddress);
    }

    // --- External Functions ---

    /**
     * @notice Configures royalty split percentages and upstream sharing for a content item.
     * @param contentId Content ID registered in ContentRegistry.
     * @param recipients Array of recipient wallet addresses.
     * @param bpsShares Basis Points shares corresponding to each recipient (Sum must = 10,000).
     * @param upstreamBps Basis Points share routed to parent content (0 if root content).
     */
    function setSplits(
        uint256 contentId,
        address[] calldata recipients,
        uint256[] calldata bpsShares,
        uint256 upstreamBps
    ) external {
        if (!contentRegistry.isContentRegistered(contentId)) {
            revert ContentNotRegistered(contentId);
        }
        if (contentRegistry.isContentFrozen(contentId)) {
            revert ContentIsFrozen(contentId);
        }

        address primaryCreator = contentRegistry.getPrimaryCreator(contentId);
        if (msg.sender != primaryCreator && msg.sender != owner()) {
            revert UnauthorizedSplitCaller(contentId, msg.sender);
        }

        SplitRule storage rule = _splitRules[contentId];
        if (rule.isLocked) {
            revert SplitsAlreadyLocked(contentId);
        }

        if (recipients.length == 0) revert EmptyRecipients();
        if (recipients.length != bpsShares.length) revert ArrayLengthMismatch();

        uint256 parentId = contentRegistry.getParentId(contentId);
        if (parentId == 0 && upstreamBps > 0) {
            revert UpstreamNotAllowedForRootContent();
        }
        if (parentId > 0 && upstreamBps >= BPS_DENOMINATOR) {
            revert InvalidUpstreamBPS(upstreamBps);
        }

        uint256 totalBps = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipientAddress();
            totalBps += bpsShares[i];
        }

        if (totalBps != BPS_DENOMINATOR) {
            revert InvalidTotalBPS(totalBps);
        }

        rule.recipients = recipients;
        rule.bpsShares = bpsShares;
        rule.upstreamBps = upstreamBps;
        rule.isConfigured = true;

        emit SplitsConfigured(contentId, recipients, bpsShares, upstreamBps);
    }

    /**
     * @notice Locks the split configuration to prevent any future modifications.
     * @param contentId Content ID.
     */
    function lockSplits(uint256 contentId) external {
        if (!contentRegistry.isContentRegistered(contentId)) revert ContentNotRegistered(contentId);

        address primaryCreator = contentRegistry.getPrimaryCreator(contentId);
        if (msg.sender != primaryCreator && msg.sender != owner()) {
            revert UnauthorizedSplitCaller(contentId, msg.sender);
        }

        SplitRule storage rule = _splitRules[contentId];
        if (!rule.isConfigured) revert SplitsNotConfigured(contentId);
        if (rule.isLocked) revert SplitsAlreadyLocked(contentId);

        rule.isLocked = true;
        emit SplitsLocked(contentId);
    }

    // --- View Functions ---

    /**
     * @notice Returns the split configuration for a given content item.
     * @param contentId Content ID.
     */
    function getSplitRule(uint256 contentId)
        external
        view
        returns (
            address[] memory recipients,
            uint256[] memory bpsShares,
            uint256 upstreamBps,
            bool isLocked,
            bool isConfigured
        )
    {
        SplitRule storage rule = _splitRules[contentId];
        return (
            rule.recipients,
            rule.bpsShares,
            rule.upstreamBps,
            rule.isLocked,
            rule.isConfigured
        );
    }

    /**
     * @notice Checks if splits are configured for a given content item.
     * @param contentId Content ID.
     */
    function isConfigured(uint256 contentId) external view returns (bool) {
        return _splitRules[contentId].isConfigured;
    }

    /**
     * @notice Recursively calculates distribution targets and token amounts across the
     *         Derivative Royalty Graph (DAG).
     * @dev Resolves upstream shares up to MAX_GRAPH_DEPTH and ensures zero rounding loss.
     * @param contentId Content ID receiving revenue.
     * @param totalAmount Total revenue amount to distribute.
     * @return targets Array of recipient wallet addresses.
     * @return amounts Array of respective amounts to credit.
     */
    function calculateSplits(uint256 contentId, uint256 totalAmount)
        public
        view
        returns (address[] memory targets, uint256[] memory amounts)
    {
        if (!_splitRules[contentId].isConfigured) revert SplitsNotConfigured(contentId);
        if (totalAmount == 0) {
            return (new address[](0), new uint256[](0));
        }

        // Pass 1: Count total recipients across ancestry DAG and validate depth
        uint256 totalRecipientsCount = 0;
        uint256 currentId = contentId;
        uint256 depth = 0;

        while (currentId != 0) {
            if (depth >= MAX_GRAPH_DEPTH) revert MaxGraphDepthExceeded(depth);
            if (!_splitRules[currentId].isConfigured) revert SplitsNotConfigured(currentId);

            SplitRule storage currentRule = _splitRules[currentId];
            totalRecipientsCount += currentRule.recipients.length;

            if (currentRule.upstreamBps == 0) {
                break;
            }

            uint256 parentId = contentRegistry.getParentId(currentId);
            if (parentId == 0) {
                break;
            }

            currentId = parentId;
            depth++;
        }

        // Pass 2: Allocate memory and calculate splits
        targets = new address[](totalRecipientsCount);
        amounts = new uint256[](totalRecipientsCount);

        currentId = contentId;
        uint256 currentAmount = totalAmount;
        uint256 writeIndex = 0;

        while (currentId != 0 && currentAmount > 0) {
            SplitRule storage rule = _splitRules[currentId];
            uint256 parentId = contentRegistry.getParentId(currentId);

            uint256 upstreamAmount = 0;
            if (parentId != 0 && rule.upstreamBps > 0) {
                upstreamAmount = (currentAmount * rule.upstreamBps) / BPS_DENOMINATOR;
            }

            uint256 localAmount = currentAmount - upstreamAmount;
            uint256 allocatedLocal = 0;

            for (uint256 i = 0; i < rule.recipients.length; i++) {
                uint256 share;
                if (i == rule.recipients.length - 1) {
                    // Give remaining local amount to the last recipient to prevent rounding dust loss
                    share = localAmount - allocatedLocal;
                } else {
                    share = (localAmount * rule.bpsShares[i]) / BPS_DENOMINATOR;
                    allocatedLocal += share;
                }

                targets[writeIndex] = rule.recipients[i];
                amounts[writeIndex] = share;
                writeIndex++;
            }

            currentAmount = upstreamAmount;
            currentId = parentId;
        }

        return (targets, amounts);
    }
}
