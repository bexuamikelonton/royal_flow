// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock ERC-20 token simulating USDC with 6 decimal places and a public faucet for testnet testing.
 * @custom:project RoyaltyFlow (project_h15)
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    event FaucetUsed(address indexed recipient, uint256 amount);

    constructor(address initialOwner) ERC20("Mock USD Coin", "MockUSDC") Ownable(initialOwner) {
        // Mint initial supply of 1,000,000 USDC to initial owner
        _mint(initialOwner, 1_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Public test faucet for developers and testnet users.
     * @param to Address receiving mock USDC.
     * @param amount Amount to mint in smallest unit (6 decimals).
     */
    function faucet(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit FaucetUsed(to, amount);
    }

    /**
     * @notice Admin minting function.
     * @param to Recipient address.
     * @param amount Amount to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
