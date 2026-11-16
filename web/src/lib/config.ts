import { http, createConfig, injected } from "wagmi";
import { avalancheFuji, hardhat } from "wagmi/chains";

// Chain mặc định: hardhat (local dev) đứng đầu, avalancheFuji dự phòng khi deploy
export const config = createConfig({
  chains: [hardhat, avalancheFuji],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
    ),
  },
  ssr: true,
});

export default config;
