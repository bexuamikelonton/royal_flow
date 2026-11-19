"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi";
import {
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Coins,
  Sparkles,
  GitFork,
  Search,
  Filter,
  Loader2,
  Lock,
  ArrowRight,
  Music,
  Image as ImageIcon,
  Box,
  FileCode,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  MOCK_USDC_ABI,
  LICENSE_MANAGER_ABI,
} from "@/lib/contracts";
import { ensureAvalancheFuji, FUJI_CHAIN_ID } from "@/lib/config";

interface MarketplaceItem {
  tierId: number;
  contentId: number;
  title: string;
  category: "Music" | "Art" | "3D" | "Code";
  primaryCreator: string;
  licenseType: "COMMERCIAL" | "PERSONAL" | "DERIVATIVE_ALLOW" | "EXCLUSIVE";
  price: number;
  paymentToken: "USDC" | "AVAX";
  ipfsCid: string;
  parentContentId: number;
  upstreamBps: number;
  splitsSummary: string;
  isFrozen: boolean;
}

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [purchasingTierId, setPurchasingTierId] = useState<number | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [isFauceting, setIsFauceting] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Sample items representing on-chain state & registered works
  const [items, setItems] = useState<MarketplaceItem[]>([
    {
      tierId: 1,
      contentId: 1,
      title: "Cyberpunk Ambient Soundtrack EP",
      category: "Music",
      primaryCreator: "0x007055a558eA6C6d7612cE04628Ce46Ad75537c0",
      licenseType: "COMMERCIAL",
      price: 100,
      paymentToken: "USDC",
      ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      parentContentId: 0,
      upstreamBps: 0,
      splitsSummary: "A (50%) • B (30%) • C (20%)",
      isFrozen: false,
    },
    {
      tierId: 2,
      contentId: 2,
      title: "Lo-Fi Cyberpunk Remix Edition (Tác phẩm Phái sinh)",
      category: "Music",
      primaryCreator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      licenseType: "COMMERCIAL",
      price: 100,
      paymentToken: "USDC",
      ipfsCid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
      parentContentId: 1,
      upstreamBps: 2000, // 20%
      splitsSummary: "20% Trích nộp ngược dòng cho #1 • 80% Tác giả E",
      isFrozen: false,
    },
    {
      tierId: 3,
      contentId: 3,
      title: "Avalanche Subnet 3D Hologram Asset",
      category: "3D",
      primaryCreator: "0x007055a558eA6C6d7612cE04628Ce46Ad75537c0",
      licenseType: "DERIVATIVE_ALLOW",
      price: 0.01,
      paymentToken: "AVAX",
      ipfsCid: "QmU7p3N2L9aJ8V6R2vQ8L7c3kXw1mP9bX4uE6vW7zY8qP3",
      parentContentId: 0,
      upstreamBps: 0,
      splitsSummary: "3D Studio (70%) • Shader Dev (30%)",
      isFrozen: false,
    },
    {
      tierId: 4,
      contentId: 4,
      title: "AI Audio Master Synthesis Engine (Smart Plugin)",
      category: "Code",
      primaryCreator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      licenseType: "EXCLUSIVE",
      price: 250,
      paymentToken: "USDC",
      ipfsCid: "QmP8k7N3Q1bX5R6tY9wZ2vL4mJ7aK3uE8vW1zY5qP9c2B",
      parentContentId: 0,
      upstreamBps: 0,
      splitsSummary: "Lead AI Researcher (100%)",
      isFrozen: true, // Example of frozen disputed work
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("royaltyflow_custom_items");
      if (saved) {
        try {
          const customItems: MarketplaceItem[] = JSON.parse(saved);
          if (customItems.length > 0) {
            setItems((prev) => {
              const existingIds = new Set(prev.map((i) => i.tierId));
              const filtered = customItems.filter((c) => !existingIds.has(c.tierId));
              return [...filtered, ...prev];
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Faucet MockUSDC for testing
  const handleClaimFaucet = async () => {
    if (!isConnected || !address) {
      alert("Vui lòng kết nối ví trước!");
      return;
    }

    setIsFauceting(true);
    try {
      await ensureAvalancheFuji();
      const hundredUsdc = 100n * 1000000n; // 100 USDC with 6 decimals
      await writeContractAsync({
        chainId: FUJI_CHAIN_ID,
        address: CONTRACT_ADDRESSES.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [address, hundredUsdc],
      });
      setTxMessage("Đã nhận 100 MockUSDC từ faucet thành công vào ví của bạn!");
    } catch (err: any) {
      console.error(err);
      setTxMessage(`Lỗi faucet: ${err?.shortMessage || err?.message}`);
    } finally {
      setIsFauceting(false);
    }
  };

  // Purchase License Flow
  const handlePurchase = async (item: MarketplaceItem) => {
    if (!isConnected || !address) {
      alert("Vui lòng kết nối ví trước!");
      return;
    }
    if (item.isFrozen) {
      alert("Tác phẩm này đang bị đóng băng do tranh chấp bản quyền!");
      return;
    }

    setPurchasingTierId(item.tierId);
    setTxMessage(`Đang chuẩn bị mua giấy phép cho "${item.title}"...`);

    try {
      await ensureAvalancheFuji();
      const isDemo =
        typeof window !== "undefined" && (window as any).ethereum?.isRoyaltyFlowDemo;

      let lastTxHash = "0x8a92b1c4e7d58f3a0c2e4b6d8f1a3c5e7b9d0f2a4c6e8b1d3f5a7c9e0b2d4f6a";
      if (item.paymentToken === "USDC") {
        const priceAmount = BigInt(item.price) * 1000000n;

        // Step 1: Approve MockUSDC to LicenseManager
        setTxMessage("Bước 1/2: Đang phê duyệt (Approve) MockUSDC cho LicenseManager...");
        const approveTx = await writeContractAsync({
          chainId: FUJI_CHAIN_ID,
          address: CONTRACT_ADDRESSES.mockUSDC,
          abi: MOCK_USDC_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.licenseManager, priceAmount],
        });

        if (!isDemo && publicClient) {
          setTxMessage("Đang chờ xác nhận giao dịch Approve trên Avalanche Fuji...");
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        // Step 2: Call purchaseLicense
        setTxMessage("Bước 2/2: Đang thực hiện thanh toán purchaseLicense và phân bổ BPS...");
        const buyTx = await writeContractAsync({
          chainId: FUJI_CHAIN_ID,
          address: CONTRACT_ADDRESSES.licenseManager,
          abi: LICENSE_MANAGER_ABI,
          functionName: "purchaseLicense",
          args: [BigInt(item.tierId)],
        });
        lastTxHash = buyTx;

        if (!isDemo && publicClient) {
          setTxMessage("Đang chờ xác nhận giao dịch mua trên Avalanche Fuji...");
          await publicClient.waitForTransactionReceipt({ hash: buyTx });
        }
      } else {
        // Native AVAX
        const priceAmount = BigInt(Math.round(item.price * 1e18));
        setTxMessage("Đang thanh toán purchaseLicense bằng Native AVAX...");
        const buyTx = await writeContractAsync({
          chainId: FUJI_CHAIN_ID,
          address: CONTRACT_ADDRESSES.licenseManager,
          abi: LICENSE_MANAGER_ABI,
          functionName: "purchaseLicense",
          args: [BigInt(item.tierId)],
          value: priceAmount,
        });
        lastTxHash = buyTx;

        if (!isDemo && publicClient) {
          setTxMessage("Đang chờ xác nhận giao dịch mua trên Avalanche Fuji...");
          await publicClient.waitForTransactionReceipt({ hash: buyTx });
        }
      }

      // Lưu lịch sử phân bổ doanh thu để hiển thị tức thì bên trang Revenue Dashboard (/dashboard)
      if (typeof window !== "undefined") {
        const existingRaw = localStorage.getItem("royaltyflow_payouts");
        const existingPayouts = existingRaw ? JSON.parse(existingRaw) : [];
        const authorShare =
          item.parentContentId > 0
            ? Number(((item.price * (item.upstreamBps / 10000)) * 0.5).toFixed(2))
            : Number((item.price * 0.5).toFixed(4));
        const newPayout = {
          id: `pay-${Date.now()}`,
          txHash: lastTxHash,
          contentTitle:
            item.parentContentId > 0
              ? `${item.title} (Trích nộp Phái sinh #${item.contentId} -> #${item.parentContentId})`
              : `${item.title} (#${item.contentId})`,
          amount: authorShare,
          token: item.paymentToken,
          date: "Vừa xong",
          status: "WITHDRAWABLE",
        };
        localStorage.setItem(
          "royaltyflow_payouts",
          JSON.stringify([newPayout, ...existingPayouts])
        );
      }

      setTxMessage(
        `THÀNH CÔNG: Đã mua bản quyền "${item.title}"! Doanh thu đã được hạch toán tức thì vào PaymentVault (xem ngay tại /dashboard).`
      );
    } catch (err: any) {
      console.error(err);
      setTxMessage(`Giao dịch thất bại: ${err?.shortMessage || err?.message}`);
    } finally {
      setPurchasingTierId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.primaryCreator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <ShoppingBag className="h-7 w-7 text-cyan-400" />
            <span>Chợ Giấy Phép Bản Quyền (License Marketplace)</span>
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Mua bản quyền kỹ thuật số bằng USDC hoặc AVAX. Doanh thu phân phối tự động theo đồ thị bản quyền ngay khi thanh toán.
          </p>
        </div>

        {/* Faucet Button */}
        <button
          onClick={handleClaimFaucet}
          disabled={isFauceting}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-semibold shadow-md shadow-cyan-950 transition-all cursor-pointer"
        >
          {isFauceting ? (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          ) : (
            <Coins className="h-4 w-4 text-cyan-400" />
          )}
          <span>Faucet 100 MockUSDC</span>
        </button>
      </div>

      {/* Global Status Banner */}
      {txMessage && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-cyan-800/60 text-xs font-mono text-cyan-200 flex items-center justify-between">
          <span>{txMessage}</span>
          <button
            onClick={() => setTxMessage(null)}
            className="text-slate-400 hover:text-white ml-4 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm tác phẩm hoặc ví tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {["ALL", "Music", "Art", "3D", "Code"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat === "ALL" ? "Tất cả" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isPurchasing = purchasingTierId === item.tierId;

          return (
            <div
              key={item.tierId}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                item.isFrozen
                  ? "bg-slate-950/60 border-red-900/40 opacity-75"
                  : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="p-6">
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-slate-800 text-slate-300 border border-slate-700/60">
                    {item.category}
                  </span>

                  {item.isFrozen ? (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/60 border border-red-800/60 text-red-400">
                      <Lock className="h-3 w-3" />
                      <span>Đóng băng tranh chấp</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
                      {item.licenseType}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white leading-snug mb-2">
                  {item.title}
                </h3>

                {/* Creator */}
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mb-4">
                  <span>Tác giả:</span>
                  <span className="text-slate-300">
                    {item.primaryCreator.slice(0, 6)}...{item.primaryCreator.slice(-4)}
                  </span>
                </div>

                {/* Derivative Tag if applicable */}
                {item.parentContentId > 0 && (
                  <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 flex items-start space-x-2 mb-4">
                    <GitFork className="h-4 w-4 shrink-0 mt-0.5 text-purple-400" />
                    <div>
                      <span className="font-semibold">Tác phẩm phái sinh từ #{item.parentContentId}</span>
                      <p className="text-[10px] text-purple-400 mt-0.5">
                        Tự động trích {item.upstreamBps / 100}% doanh thu nộp ngược dòng cho tác phẩm gốc.
                      </p>
                    </div>
                  </div>
                )}

                {/* Splits Summary */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1 mb-4">
                  <span className="text-slate-400 font-medium text-[11px]">Cấu hình chia BPS:</span>
                  <p className="text-slate-200 font-medium">{item.splitsSummary}</p>
                </div>
              </div>

              {/* Bottom Price & Purchase Button */}
              <div className="p-6 pt-0 border-t border-slate-800/60 bg-slate-950/30">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <span className="text-xs text-slate-400">Giá giấy phép:</span>
                  <div className="text-lg font-bold text-white flex items-center space-x-1">
                    <span>{item.price}</span>
                    <span className="text-xs font-semibold text-cyan-400">{item.paymentToken}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isPurchasing || item.isFrozen}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    item.isFrozen
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  }`}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang xử lý mua...</span>
                    </>
                  ) : item.isFrozen ? (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Đang tranh chấp (Tạm khóa)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      <span>Mua Bản Quyền ({item.price} {item.paymentToken})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
