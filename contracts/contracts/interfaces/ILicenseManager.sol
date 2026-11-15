// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILicenseManager {
    enum LicenseType {
        PERSONAL,
        COMMERCIAL,
        DERIVATIVE_ALLOW,
        EXCLUSIVE
    }

    struct LicenseTier {
        uint256 tierId;
        uint256 contentId;
        LicenseType licenseType;
        address paymentToken;
        uint256 price;
        uint256 durationInDays;
        bool isActive;
    }

    struct LicenseRecord {
        uint256 licenseId;
        uint256 tierId;
        uint256 contentId;
        address licensee;
        uint256 purchaseTime;
        uint256 expiresAt;
    }

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

    function createTier(
        uint256 contentId,
        uint8 licenseType,
        address paymentToken,
        uint256 price,
        uint256 durationInDays
    ) external returns (uint256);

    function purchaseLicense(uint256 tierId) external payable returns (uint256);
    function setTierStatus(uint256 tierId, bool isActive) external;

    function getTier(uint256 tierId) external view returns (LicenseTier memory);
    function getLicense(uint256 licenseId) external view returns (LicenseRecord memory);
    function getContentTiers(uint256 contentId) external view returns (uint256[] memory);
    function hasValidLicense(uint256 contentId, address licensee) external view returns (bool);
}
