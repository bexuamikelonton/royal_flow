import httpx
from typing import Dict, Any
from app.core.config import settings

class Web3Service:
    def __init__(self):
        self.rpc_url = settings.RPC_URL
        self.chain_id = settings.CHAIN_ID

    async def get_block_number(self) -> int:
        """Queries latest block height from Avalanche Fuji C-Chain RPC."""
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                res = await client.post(self.rpc_url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return int(data.get("result", "0x0"), 16)
            except Exception as e:
                print(f"[Web3 RPC Warning]: {e}")
        return 0

    async def get_network_health(self) -> Dict[str, Any]:
        """Returns health status of Avalanche Fuji connection."""
        block = await self.get_block_number()
        return {
            "network": "Avalanche Fuji C-Chain",
            "chain_id": self.chain_id,
            "rpc_url": self.rpc_url,
            "connected": block > 0,
            "latest_block": block
        }

web3_service = Web3Service()
