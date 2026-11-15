// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ContentRegistry.sol";
import "./PaymentVault.sol";

/**
 * @title LicenseManager
 * @dev Manages digital license tiers (Personal, Commercial, Derivative, Exclusive),
 *      handles payment processing via PaymentVault, and tracks on-chain license proofs.
 * @custom:project RoyaltyFlow (project_h15)
 */
contract LicenseManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Enums & Structs ---

    enum LicenseType {
        PERSONAL,          // 0: Non-commercial personal viewing
        COMMERCIAL,        // 1: Advertising, business, broadcasting
        DERIVATIVE_ALLOW,  // 2: Grants right to create derivative works
        EXCLUSIVE          // 3: Exclusive rights
    }

    struct LicenseTier {
        uint256 tierId;
        uint256 contentId;
        LicenseType licenseType;
        address paymentToken; // address(0) for native AVAX, or ERC-20 address
        uint256 price;
        uint256 durationInDays; // 0 = Perpetual (no expiration)
        bool isActive;
    }

    struct LicenseRecord {
        uint256 licenseId;
        uint256 tierId;
        uint256 contentId;
        address licensee;
        uint256 purchaseTime;
        uint256 expiresAt; // 0 = Perpetual
    }

    // --- State Variables ---

    ContentRegistry public immutable contentRegistry;
    PaymentVault public immutable paymentVault;

    uint256 public totalTiers;
    uint256 public totalLicenses;

    mapping(uint256 => LicenseTier) private _tiers;
    mapping(uint256 => LicenseRecord) private _licenses;
    mapping(uint256 => uint256[]) private _contentTiers;

    // contentId => licensee => hasLicense
    mapping(uint256 => mapping(address => bool)) private _hasActiveLicense;

    // --- Events ---

    event TierCreated(
        uint256 indexed tierId,
        uint256 indexed contentId,
        LicenseType licenseType,
        address paymentToken,
        uint256 price,
        uint256 durationInDays
    );

    event TierStatusUpdated(uint256 indexed tierId, bool isActive);

    event LicensePurchased(
        uint256 indexed licenseId,
        uint256 indexed tierId,
        uint256 indexed contentId,
        address licensee,
        uint256 price,
        uint256 expiresAt
    );

    // --- Errors ---

    error ContentNotRegistered(uint256 contentId);
    error ContentIsFrozen(uint256 contentId);
    error UnauthorizedTierCreator(uint256 contentId, address caller);
    error InvalidTierPrice();
    error TierNotFound(uint256 tierId);
    error TierInactive(uint256 tierId);
    error PaymentAmountMismatch(uint256 expected, uint256 actual);
    error NativeAvaxNotAccepted();

    // --- Constructor ---

    constructor(
        address contentRegistryAddress,
        address payable paymentVaultAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        require(contentRegistryAddress != address(0), "Invalid ContentRegistry address");
        require(paymentVaultAddress != address(0), "Invalid PaymentVault address");

        contentRegistry = ContentRegistry(contentRegistryAddress);
        paymentVault = PaymentVault(paymentVaultAddress);
    }

    // --- External Functions ---

    /**
     * @notice Creates a new commercial license tier for a registered content piece.
     * @param contentId Content ID.
     * @param licenseType Type of license (0: PERSONAL, 1: COMMERCIAL, 2: DERIVATIVE_ALLOW, 3: EXCLUSIVE).
     * @param paymentToken Token used for payment (address(0) for native AVAX).
     * @param price Price in smallest unit of payment token.
     * @param durationInDays License validity duration in days (0 for lifetime/perpetual).
     * @return tierId Newly assigned tier identifier.
     */
    function createTier(
        uint256 contentId,
        uint8 licenseType,
        address paymentToken,
        uint256 price,
        uint256 durationInDays
    ) external returns (uint256) {
        if (!contentRegistry.isContentRegistered(contentId)) {
            revert ContentNotRegistered(contentId);
        }
        if (contentRegistry.isContentFrozen(contentId)) {
            revert ContentIsFrozen(contentId);
        }

        address primaryCreator = contentRegistry.getPrimaryCreator(contentId);
        if (msg.sender != primaryCreator && msg.sender != owner()) {
            revert UnauthorizedTierCreator(contentId, msg.sender);
        }
        if (price == 0) revert InvalidTierPrice();
        require(licenseType <= uint8(LicenseType.EXCLUSIVE), "Invalid license type");

        uint256 tierId = ++totalTiers;

        _tiers[tierId] = LicenseTier({
            tierId: tierId,
            contentId: contentId,
            licenseType: LicenseType(licenseType),
            paymentToken: paymentToken,
            price: price,
            durationInDays: durationInDays,
            isActive: true
        });

        _contentTiers[contentId].push(tierId);

        emit TierCreated(
            tierId,
            contentId,
            LicenseType(licenseType),
            paymentToken,
            price,
            durationInDays
        );

        return tierId;
    }

    /**
     * @notice Purchases a license tier and automatically distributes revenue to PaymentVault.
     * @param tierId ID of license tier to purchase.
     * @return licenseId Assigned unique license identifier.
     */
    function purchaseLicense(uint256 tierId) external payable nonReentrant returns (uint256) {
        LicenseTier storage tier = _tiers[tierId];
        if (tier.tierId == 0) revert TierNotFound(tierId);
        if (!tier.isActive) revert TierInactive(tierId);

        // Crucial security check: Cannot purchase if content is frozen due to dispute
        if (contentRegistry.isContentFrozen(tier.contentId)) {
            revert ContentIsFrozen(tier.contentId);
        }

        // Process payment transfer to PaymentVault
        if (tier.paymentToken == address(0)) {
            if (msg.value != tier.price) {
                revert PaymentAmountMismatch(tier.price, msg.value);
            }
            // Forward native AVAX directly to PaymentVault
            paymentVault.creditRevenue{value: msg.value}(
                tier.contentId,
                address(0),
                tier.price
            );
        } else {
            if (msg.value != 0) revert NativeAvaxNotAccepted();

            // Transfer ERC20 from buyer to PaymentVault
            IERC20(tier.paymentToken).safeTransferFrom(
                msg.sender,
                address(paymentVault),
                tier.price
            );

            // Instruct PaymentVault to credit splits
            paymentVault.creditRevenue(
                tier.contentId,
                tier.paymentToken,
                tier.price
            );
        }

        uint256 licenseId = ++totalLicenses;
        uint256 expiresAt = tier.durationInDays > 0
            ? block.timestamp + (tier.durationInDays * 1 days)
            : 0;

        _licenses[licenseId] = LicenseRecord({
            licenseId: licenseId,
            tierId: tierId,
            contentId: tier.contentId,
            licensee: msg.sender,
            purchaseTime: block.timestamp,
            expiresAt: expiresAt
        });

        _hasActiveLicense[tier.contentId][msg.sender] = true;

        emit LicensePurchased(
            licenseId,
            tierId,
            tier.contentId,
            msg.sender,
            tier.price,
            expiresAt
        );

        return licenseId;
    }

    /**
     * @notice Updates active status of a license tier.
     * @param tierId ID of tier.
     * @param isActive New active status.
     */
    function setTierStatus(uint256 tierId, bool isActive) external {
        LicenseTier storage tier = _tiers[tierId];
        if (tier.tierId == 0) revert TierNotFound(tierId);

        address primaryCreator = contentRegistry.getPrimaryCreator(tier.contentId);
        if (msg.sender != primaryCreator && msg.sender != owner()) {
            revert UnauthorizedTierCreator(tier.contentId, msg.sender);
        }

        tier.isActive = isActive;
        emit TierStatusUpdated(tierId, isActive);
    }

    // --- View Functions ---

    /**
     * @notice Returns details of a specific license tier.
     * @param tierId Tier ID.
     */
    function getTier(uint256 tierId) external view returns (LicenseTier memory) {
        if (_tiers[tierId].tierId == 0) revert TierNotFound(tierId);
        return _tiers[tierId];
    }

    /**
     * @notice Returns details of a purchased license record.
     * @param licenseId License ID.
     */
    function getLicense(uint256 licenseId) external view returns (LicenseRecord memory) {
        require(_licenses[licenseId].licenseId > 0, "License not found");
        return _licenses[licenseId];
    }

    /**
     * @notice Returns array of tier IDs associated with a given content item.
     * @param contentId Content ID.
     */
    function getContentTiers(uint256 contentId) external view returns (uint256[] memory) {
        return _contentTiers[contentId];
    }

    /**
     * @notice Checks if an address holds a valid unexpired license for a content item.
     * @param contentId Content ID.
     * @param licensee Address to verify.
     */
    function hasValidLicense(uint256 contentId, address licensee) external view returns (bool) {
        return _hasActiveLicense[contentId][licensee];
    }
}
