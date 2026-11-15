import { http, createConfig, injected } from "wagmi";
import { avalancheFuji, hardhat } from "wagmi/chains";

export const config = createConfig({
  chains: [avalancheFuji, hardhat],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
    ),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

export default config;
