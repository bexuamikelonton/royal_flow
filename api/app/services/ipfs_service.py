import hashlib
from typing import Tuple

class IPFSService:
    @staticmethod
    def calculate_sha256(data: bytes) -> str:
        """Calculates SHA-256 hash formatted as 0x prefixed hex string (bytes32)."""
        hasher = hashlib.sha256()
        hasher.update(data)
        return "0x" + hasher.hexdigest()

    @staticmethod
    def generate_ipfs_cid(data: bytes) -> str:
        """Generates deterministic IPFS CID (v0 format Qm...) from data bytes."""
        hasher = hashlib.sha256()
        hasher.update(data)
        digest = hasher.hexdigest()
        # Qm format prefix (Base58 mock format)
        return f"Qm{digest[:44]}"

    @classmethod
    def process_file(cls, data: bytes) -> Tuple[str, str]:
        """Returns (sha256_hash, ipfs_cid)."""
        sha256 = cls.calculate_sha256(data)
        cid = cls.generate_ipfs_cid(data)
        return sha256, cid

ipfs_service = IPFSService()
