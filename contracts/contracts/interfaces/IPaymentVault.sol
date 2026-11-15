// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPaymentVault {
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

    function creditRevenue(
        uint256 contentId,
        address token,
        uint256 amount
    ) external payable;

    function withdraw(address token) external;
    function withdrawBatch(address[] calldata tokens) external;

    function getPendingBalance(address token, address user) external view returns (uint256);
    function getTotalContentRevenue(uint256 contentId, address token) external view returns (uint256);
}
