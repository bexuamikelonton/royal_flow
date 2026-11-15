// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRoyaltySplitter {
    struct SplitRule {
        address[] recipients;
        uint256[] bpsShares;
        uint256 upstreamBps;
        bool isLocked;
        bool isConfigured;
    }

    event SplitsConfigured(
        uint256 indexed contentId,
        address[] recipients,
        uint256[] bpsShares,
        uint256 upstreamBps
    );

    event SplitsLocked(uint256 indexed contentId);

    function setSplits(
        uint256 contentId,
        address[] calldata recipients,
        uint256[] calldata bpsShares,
        uint256 upstreamBps
    ) external;

    function lockSplits(uint256 contentId) external;

    function getSplitRule(uint256 contentId)
        external
        view
        returns (
            address[] memory recipients,
            uint256[] memory bpsShares,
            uint256 upstreamBps,
            bool isLocked,
            bool isConfigured
        );

    function isConfigured(uint256 contentId) external view returns (bool);

    function calculateSplits(uint256 contentId, uint256 totalAmount)
        external
        view
        returns (address[] memory targets, uint256[] memory amounts);
}
