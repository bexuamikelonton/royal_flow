// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ContentRegistry
 * @dev Manages digital content identity, IPFS metadata CIDs, SHA-256 integrity hashes,
 *      derivative parent-child lineage, and content freeze state for dispute resolution.
 * @custom:project RoyaltyFlow (project_h15)
 */
contract ContentRegistry is Ownable {
    // --- Data Structures ---

    struct ContentItem {
        uint256 contentId;
        address primaryCreator;
        string ipfsCid;
        bytes32 contentSha256;
        uint256 parentContentId; // 0 if root content, > 0 if derivative work
        uint256 registrationTime;
        bool isRegistered;
        bool isFrozen;
    }

    // --- State Variables ---

    uint256 public totalContents;
    mapping(uint256 => ContentItem) private _contents;
    mapping(address => uint256[]) private _creatorContents;

    // --- Events ---

    event ContentRegistered(
        uint256 indexed contentId,
        address indexed primaryCreator,
        string ipfsCid,
        bytes32 contentSha256,
        uint256 indexed parentContentId
    );

    event ContentFrozen(uint256 indexed contentId);
    event ContentUnfrozen(uint256 indexed contentId);

    // --- Errors ---

    error EmptyIPFSCid();
    error InvalidContentHash();
    error ContentNotFound(uint256 contentId);
    error ContentAlreadyFrozen(uint256 contentId);
    error ContentNotFrozen(uint256 contentId);
    error ParentContentNotFound(uint256 parentContentId);
    error ParentContentFrozen(uint256 parentContentId);
    error UnauthorizedCreator(uint256 contentId, address caller);

    // --- Constructor ---

    constructor(address initialOwner) Ownable(initialOwner) {}

    // --- External Functions ---

    /**
     * @notice Registers a new digital creative content item.
     * @param ipfsCid IPFS CID pointing to content asset or metadata.
     * @param contentSha256 SHA-256 cryptographic hash of raw asset file off-chain.
     * @param parentContentId Parent content ID if derivative work (0 if original root).
     * @return contentId The newly assigned unique content identifier.
     */
    function registerContent(
        string calldata ipfsCid,
        bytes32 contentSha256,
        uint256 parentContentId
    ) external returns (uint256) {
        if (bytes(ipfsCid).length == 0) revert EmptyIPFSCid();
        if (contentSha256 == bytes32(0)) revert InvalidContentHash();

        if (parentContentId > 0) {
            if (!_contents[parentContentId].isRegistered) {
                revert ParentContentNotFound(parentContentId);
            }
            if (_contents[parentContentId].isFrozen) {
                revert ParentContentFrozen(parentContentId);
            }
        }

        uint256 contentId = ++totalContents;

        _contents[contentId] = ContentItem({
            contentId: contentId,
            primaryCreator: msg.sender,
            ipfsCid: ipfsCid,
            contentSha256: contentSha256,
            parentContentId: parentContentId,
            registrationTime: block.timestamp,
            isRegistered: true,
            isFrozen: false
        });

        _creatorContents[msg.sender].push(contentId);

        emit ContentRegistered(
            contentId,
            msg.sender,
            ipfsCid,
            contentSha256,
            parentContentId
        );

        return contentId;
    }

    /**
     * @notice Freezes a content item in case of copyright disputes or arbitration.
     * @dev Only the contract owner (admin/arbitrator) can execute this.
     * @param contentId ID of content to freeze.
     */
    function freezeContent(uint256 contentId) external onlyOwner {
        if (!_contents[contentId].isRegistered) revert ContentNotFound(contentId);
        if (_contents[contentId].isFrozen) revert ContentAlreadyFrozen(contentId);

        _contents[contentId].isFrozen = true;
        emit ContentFrozen(contentId);
    }

    /**
     * @notice Unfreezes a content item once a dispute is resolved.
     * @dev Only the contract owner (admin/arbitrator) can execute this.
     * @param contentId ID of content to unfreeze.
     */
    function unfreezeContent(uint256 contentId) external onlyOwner {
        if (!_contents[contentId].isRegistered) revert ContentNotFound(contentId);
        if (!_contents[contentId].isFrozen) revert ContentNotFrozen(contentId);

        _contents[contentId].isFrozen = false;
        emit ContentUnfrozen(contentId);
    }

    // --- View Functions ---

    /**
     * @notice Returns full details of a registered content item.
     * @param contentId Content ID.
     */
    function getContent(uint256 contentId) external view returns (ContentItem memory) {
        if (!_contents[contentId].isRegistered) revert ContentNotFound(contentId);
        return _contents[contentId];
    }

    /**
     * @notice Checks whether a content item is frozen.
     * @param contentId Content ID.
     */
    function isContentFrozen(uint256 contentId) external view returns (bool) {
        return _contents[contentId].isFrozen;
    }

    /**
     * @notice Checks whether a content item has been registered.
     * @param contentId Content ID.
     */
    function isContentRegistered(uint256 contentId) external view returns (bool) {
        return _contents[contentId].isRegistered;
    }

    /**
     * @notice Returns the parent content ID for derivative graph traversal.
     * @param contentId Content ID.
     */
    function getParentId(uint256 contentId) external view returns (uint256) {
        return _contents[contentId].parentContentId;
    }

    /**
     * @notice Returns the primary creator address for a given content item.
     * @param contentId Content ID.
     */
    function getPrimaryCreator(uint256 contentId) external view returns (address) {
        return _contents[contentId].primaryCreator;
    }

    /**
     * @notice Returns list of content IDs registered by a specific creator.
     * @param creator Wallet address of creator.
     */
    function getCreatorContents(address creator) external view returns (uint256[] memory) {
        return _creatorContents[creator];
    }
}
