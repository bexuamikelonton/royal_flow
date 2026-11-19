import { http, createConfig, injected } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

export const FUJI_CHAIN_ID = 43113;
export const FUJI_HEX_CHAIN_ID = "0xa869";

/**
 * Tự động yêu cầu ví Web3 (MetaMask / Core / OKX...) chuyển sang mạng Avalanche Fuji C-Chain (43113).
 * Nếu ví chưa có mạng Fuji, tự động thêm mạng Fuji vào ví.
 */
export async function ensureAvalancheFuji(): Promise<void> {
  if (typeof window === "undefined") return;
  const eth = (window as any).ethereum;
  if (!eth || eth.isRoyaltyFlowDemo) return;

  try {
    const currentChainHex = await eth.request({ method: "eth_chainId" });
    if (
      typeof currentChainHex === "string" &&
      currentChainHex.toLowerCase() === FUJI_HEX_CHAIN_ID
    ) {
      return;
    }

    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FUJI_HEX_CHAIN_ID }],
    });
  } catch (switchError: any) {
    // Mã lỗi 4902: Ví chưa từng thêm mạng Avalanche Fuji
    if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: FUJI_HEX_CHAIN_ID,
            chainName: "Avalanche Fuji Testnet",
            nativeCurrency: {
              name: "Avalanche",
              symbol: "AVAX",
              decimals: 18,
            },
            rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
            blockExplorerUrls: ["https://testnet.snowtrace.io/"],
          },
        ],
      });
    } else {
      console.warn("Could not auto-switch to Avalanche Fuji:", switchError);
    }
  }
}

export const DEMO_ACCOUNTS = [
  {
    label: "Tác giả A (50%)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`,
  },
  {
    label: "Tác giả B (30% - Ký HITL)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as `0x${string}`,
  },
  {
    label: "Khách mua License",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as `0x${string}`,
  },
];

type Listener = (...args: any[]) => void;

export function installDemoEthereumProvider(
  initialAddress: string = DEMO_ACCOUNTS[0].address
) {
  if (typeof window === "undefined") return null;

  const w = window as any;
  if (w.__royaltyFlowDemoProvider) {
    w.__royaltyFlowDemoProvider.setAccount(initialAddress);
    w.ethereum = w.__royaltyFlowDemoProvider;
    return w.__royaltyFlowDemoProvider;
  }

  let currentAccount = initialAddress;
  let currentChainId = "0xa869"; // 43113 (Avalanche Fuji)
  const listeners: Record<string, Set<Listener>> = {};

  const emit = (event: string, ...args: any[]) => {
    listeners[event]?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        console.error(e);
      }
    });
  };

  const provider = {
    isMetaMask: true,
    isRoyaltyFlowDemo: true,
    selectedAddress: currentAccount,
    chainId: currentChainId,
    setAccount(addr: string) {
      currentAccount = addr;
      this.selectedAddress = addr;
      emit("accountsChanged", [currentAccount]);
    },
    on(event: string, fn: Listener) {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(fn);
      return this;
    },
    removeListener(event: string, fn: Listener) {
      listeners[event]?.delete(fn);
      return this;
    },
    off(event: string, fn: Listener) {
      listeners[event]?.delete(fn);
      return this;
    },
    async request({ method, params }: { method: string; params?: any[] }) {
      switch (method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          return [currentAccount];
        case "eth_chainId":
          return currentChainId;
        case "net_version":
          return "43113";
        case "wallet_switchEthereumChain":
          if (params?.[0]?.chainId) {
            currentChainId = params[0].chainId;
            emit("chainChanged", currentChainId);
          }
          return null;
        case "wallet_addEthereumChain":
          return null;
        case "wallet_requestPermissions":
        case "wallet_getPermissions":
          return [{ parentCapability: "eth_accounts" }];
        case "eth_getBalance":
          // 12.5 AVAX in wei (hex)
          return "0xad78ebc5ac6200000";
        case "eth_estimateGas":
          return "0x30d40";
        case "eth_gasPrice":
          return "0x5d21dba00";
        case "eth_sendTransaction": {
          await new Promise((r) => setTimeout(r, 600));
          const randomHex = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join("");
          return `0x${randomHex}`;
        }
        case "eth_signTypedData_v4":
        case "eth_signTypedData":
        case "personal_sign": {
          await new Promise((r) => setTimeout(r, 500));
          return "0x4b78a9c2df3108c5e0b674a9f8e3d21c5b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d1b";
        }
        default:
          return null;
      }
    },
  };

  w.__royaltyFlowDemoProvider = provider;
  w.ethereum = provider;
  return provider;
}

// Tự động khởi tạo Demo Provider nếu trình duyệt chưa cài MetaMask / Core Wallet
if (typeof window !== "undefined" && !(window as any).ethereum) {
  installDemoEthereumProvider();
}

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
    ),
  },
  ssr: true,
});

export default config;
