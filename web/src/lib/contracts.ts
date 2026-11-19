// ABI and deployed contract addresses for RoyaltyFlow Web Application

export const CONTRACT_ADDRESSES = {
  mockUSDC: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || "0xd4982321D81420F4504AFf00FDACaB626a19bC7F") as `0x${string}`,
  contentRegistry: (process.env.NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS || "0x36F9912d229dAC5F8e061633B0240E9dCFbdCc0e") as `0x${string}`,
  royaltySplitter: (process.env.NEXT_PUBLIC_ROYALTY_SPLITTER_ADDRESS || "0x2D61b88c0eA9eD339aEa3a6398D1DCFA663167aB") as `0x${string}`,
  paymentVault: (process.env.NEXT_PUBLIC_PAYMENT_VAULT_ADDRESS || "0x4134E62861DCF203C86Db99352f693903894aC5f") as `0x${string}`,
  licenseManager: (process.env.NEXT_PUBLIC_LICENSE_MANAGER_ADDRESS || "0x6cD504472999f4cfCAb86dddB3d8967d1647538d") as `0x${string}`,
};

export const MOCK_USDC_ABI = [
  {
    inputs: [{ internalType: "address", name: "initialOwner", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "pure",
    type: "function",
  },
] as const;

export const CONTENT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "string", name: "ipfsCid", type: "string" },
      { internalType: "bytes32", name: "contentSha256", type: "bytes32" },
      { internalType: "uint256", name: "parentContentId", type: "uint256" },
    ],
    name: "registerContent",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    name: "getContent",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "address", name: "primaryCreator", type: "address" },
          { internalType: "string", name: "ipfsCid", type: "string" },
          { internalType: "bytes32", name: "contentSha256", type: "bytes32" },
          { internalType: "uint256", name: "parentContentId", type: "uint256" },
          { internalType: "uint256", name: "registrationTime", type: "uint256" },
          { internalType: "bool", name: "isRegistered", type: "bool" },
          { internalType: "bool", name: "isFrozen", type: "bool" },
        ],
        internalType: "struct ContentRegistry.ContentItem",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    name: "isContentFrozen",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalContents",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ROYALTY_SPLITTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256[]", name: "bpsShares", type: "uint256[]" },
      { internalType: "uint256", name: "upstreamBps", type: "uint256" },
    ],
    name: "setSplits",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    name: "getSplitRule",
    outputs: [
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256[]", name: "bpsShares", type: "uint256[]" },
      { internalType: "uint256", name: "upstreamBps", type: "uint256" },
      { internalType: "bool", name: "isLocked", type: "bool" },
      { internalType: "bool", name: "isConfigured", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
    ],
    name: "calculateSplits",
    outputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PAYMENT_VAULT_ABI = [
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "getPendingBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "token", type: "address" },
    ],
    name: "getTotalContentRevenue",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const LICENSE_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "uint8", name: "licenseType", type: "uint8" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "durationInDays", type: "uint256" },
    ],
    name: "createTier",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tierId", type: "uint256" }],
    name: "purchaseLicense",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tierId", type: "uint256" }],
    name: "getTier",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "tierId", type: "uint256" },
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "uint8", name: "licenseType", type: "uint8" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "durationInDays", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
        ],
        internalType: "struct LicenseManager.LicenseTier",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalTiers",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "licensee", type: "address" },
    ],
    name: "hasValidLicense",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
