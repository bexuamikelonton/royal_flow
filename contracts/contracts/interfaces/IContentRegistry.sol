// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IContentRegistry {
    struct ContentItem {
        uint256 contentId;
        address primaryCreator;
        string ipfsCid;
        bytes32 contentSha256;
        uint256 parentContentId;
        uint256 registrationTime;
        bool isRegistered;
        bool isFrozen;
    }

    event ContentRegistered(
        uint256 indexed contentId,
        address indexed primaryCreator,
        string ipfsCid,
        bytes32 contentSha256,
        uint256 indexed parentContentId
    );

    event ContentFrozen(uint256 indexed contentId);
    event ContentUnfrozen(uint256 indexed contentId);

    function registerContent(
        string calldata ipfsCid,
        bytes32 contentSha256,
        uint256 parentContentId
    ) external returns (uint256);

    function freezeContent(uint256 contentId) external;
    function unfreezeContent(uint256 contentId) external;

    function getContent(uint256 contentId) external view returns (ContentItem memory);
    function isContentFrozen(uint256 contentId) external view returns (bool);
    function isContentRegistered(uint256 contentId) external view returns (bool);
    function getParentId(uint256 contentId) external view returns (uint256);
    function getPrimaryCreator(uint256 contentId) external view returns (address);
    function getCreatorContents(address creator) external view returns (uint256[] memory);
}
