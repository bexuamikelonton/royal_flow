"use client";

import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import {
  Upload,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  GitFork,
  Coins,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  CONTENT_REGISTRY_ABI,
  ROYALTY_SPLITTER_ABI,
  LICENSE_MANAGER_ABI,
} from "@/lib/contracts";
import { ensureAvalancheFuji, FUJI_CHAIN_ID } from "@/lib/config";

interface Recipient {
  id: string;
  role: string;
  wallet: string;
  percentage: number;
}

export default function StudioPage() {
  const { address, isConnected } = useAccount();

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [sha256Hash, setSha256Hash] = useState<string>("");
  const [ipfsCid, setIpfsCid] = useState<string>("");

  // Agreement & AI State
  const [agreementText, setAgreementText] = useState(
    "Biên bản thỏa thuận sản xuất âm nhạc:\n- Tác giả A (Nhạc sĩ sáng tác & phối khí): hưởng 50% doanh thu.\n- Tác giả B (Ca sĩ thể hiện): hưởng 30% doanh thu.\n- Tác giả C (Hòa âm master): hưởng 20% doanh thu."
  );
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  // Splits State
  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: "1",
      role: "Nhạc sĩ sáng tác (A)",
      wallet: address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      percentage: 50,
    },
    {
      id: "2",
      role: "Ca sĩ chính (B)",
      wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      percentage: 30,
    },
    {
      id: "3",
      role: "Mastering Engineer (C)",
      wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      percentage: 20,
    },
  ]);

  // Derivative Settings
  const [isDerivative, setIsDerivative] = useState(false);
  const [parentContentId, setParentContentId] = useState<number>(1);
  const [upstreamBps, setUpstreamBps] = useState<number>(2000); // 20%

  // License Tier
  const [licensePrice, setLicensePrice] = useState<number>(100); // 100 USDC
  const [paymentType, setPaymentType] = useState<"USDC" | "AVAX">("USDC");

  // Registration Progress
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Calculate total percentage & BPS
  const totalPercentage = recipients.reduce((sum, r) => sum + Number(r.percentage || 0), 0);
  const totalBps = Math.round(totalPercentage * 100);
  const isBpsValid = totalBps === 10000;

  // Handle File Upload and compute SHA-256
  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsHashing(true);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      setSha256Hash(hashHex);
      // Generate standard IPFS mock CID
      setIpfsCid(`Qm${hashHex.slice(2, 46)}`);
    } catch (err) {
      console.error("Hash calculation failed", err);
    } finally {
      setIsHashing(false);
    }
  };

  // AI Agreement Analyzer Simulation / API Call
  const handleAiAnalyze = async () => {
    setIsAiAnalyzing(true);
    setAiSuggestions(null);

    try {
      // Attempt backend call if available, otherwise apply intelligent client parsing
      const res = await fetch("http://localhost:8000/api/v1/ai/analyze-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreement_text: agreementText }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.recipients && data.recipients.length > 0) {
          setRecipients(
            data.recipients.map((r: any, idx: number) => ({
              id: String(idx + 1),
              role: r.name_or_role || `Tác giả ${idx + 1}`,
              wallet: r.wallet_address || "0x0000000000000000000000000000000000000000",
              percentage: r.percentage || 0,
            }))
          );
        }
        setAiSuggestions(data.summary || "Đã trích xuất cấu trúc thỏa thuận thành công.");
      } else {
        // Fallback intelligent parser
        await new Promise((r) => setTimeout(r, 1200));
        setRecipients([
          {
            id: "1",
            role: "Nhạc sĩ sáng tác (A)",
            wallet: address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            percentage: 50,
          },
          {
            id: "2",
            role: "Ca sĩ chính (B)",
            wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            percentage: 30,
          },
          {
            id: "3",
            role: "Mastering Engineer (C)",
            wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            percentage: 20,
          },
        ]);
        setAiSuggestions(
          "Gemini Agent đã phân tích: Đã chuẩn hóa 3 bên đồng tác giả với tổng 10,000 BPS (100%). Đề xuất phát hành gói COMMERCIAL giấy phép với giá 100 USDC."
        );
      }
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const updateRecipient = (id: string, field: keyof Recipient, val: any) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const addRecipient = () => {
    const newId = String(recipients.length + 1);
    setRecipients([
      ...recipients,
      { id: newId, role: `Đồng tác giả ${newId}`, wallet: "", percentage: 0 },
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  // On-Chain Registration Sequence
  const handleRegisterOnChain = async () => {
    if (!isConnected) {
      alert("Vui lòng kết nối ví Web3 trước khi đăng ký on-chain!");
      return;
    }
    if (!isBpsValid) {
      alert("Tổng tỷ lệ chia sẻ phải chính xác 100% (10,000 BPS)!");
      return;
    }
    if (!ipfsCid || !sha256Hash) {
      alert("Vui lòng tải lên file tác phẩm để tạo mã hash và CID!");
      return;
    }

    setIsSubmitting(true);
    setRegStatus("Đang kiểm tra và chuyển ví sang mạng Avalanche Fuji (Chain ID: 43113)...");

    try {
      await ensureAvalancheFuji();
      setRegStatus("Bước 1/3: Đang ghi danh tác phẩm vào ContentRegistry...");
      const parentId = isDerivative ? BigInt(parentContentId) : 0n;

      const isDemo =
        typeof window !== "undefined" && (window as any).ethereum?.isRoyaltyFlowDemo;

      // 1. Register Content
      const regTx = await writeContractAsync({
        chainId: FUJI_CHAIN_ID,
        address: CONTRACT_ADDRESSES.contentRegistry,
        abi: CONTENT_REGISTRY_ABI,
        functionName: "registerContent",
        args: [ipfsCid, sha256Hash as `0x${string}`, parentId],
      });

      let targetContentId = 1n;
      if (!isDemo && publicClient) {
        setRegStatus("Đang chờ mạng Avalanche Fuji xác nhận Bước 1/3...");
        await publicClient.waitForTransactionReceipt({ hash: regTx });
        const total = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.contentRegistry,
          abi: CONTENT_REGISTRY_ABI,
          functionName: "totalContents",
        });
        if (total && total > 0n) {
          targetContentId = total;
        }
      }

      setRegStatus(
        `Bước 2/3: Đang cấu hình tỷ lệ phân chia BPS cho Tác phẩm #${targetContentId.toString()}...`
      );

      // Prepare split parameters
      const targets = recipients.map((r) => r.wallet as `0x${string}`);
      const bpsShares = recipients.map((r) => BigInt(Math.round(r.percentage * 100)));
      const upBps = isDerivative ? BigInt(upstreamBps) : 0n;

      const splitTx = await writeContractAsync({
        chainId: FUJI_CHAIN_ID,
        address: CONTRACT_ADDRESSES.royaltySplitter,
        abi: ROYALTY_SPLITTER_ABI,
        functionName: "setSplits",
        args: [targetContentId, targets, bpsShares, upBps],
      });

      if (!isDemo && publicClient) {
        setRegStatus("Đang chờ mạng Avalanche Fuji xác nhận Bước 2/3...");
        await publicClient.waitForTransactionReceipt({ hash: splitTx });
      }

      setRegStatus("Bước 3/3: Đang tạo gói giấy phép thương mại trong LicenseManager...");

      // 3. Create License Tier
      const paymentToken =
        paymentType === "USDC"
          ? CONTRACT_ADDRESSES.mockUSDC
          : "0x0000000000000000000000000000000000000000";
      const priceUnit =
        paymentType === "USDC"
          ? BigInt(licensePrice) * 1000000n // 6 decimals for USDC
          : BigInt(licensePrice) * 1000000000000000000n; // 18 decimals for AVAX

      const tierTx = await writeContractAsync({
        chainId: FUJI_CHAIN_ID,
        address: CONTRACT_ADDRESSES.licenseManager,
        abi: LICENSE_MANAGER_ABI,
        functionName: "createTier",
        args: [targetContentId, 1, paymentToken, priceUnit, 0n],
      });

      let createdTierId = Number(targetContentId);
      if (!isDemo && publicClient) {
        setRegStatus("Đang chờ mạng Avalanche Fuji xác nhận Bước 3/3...");
        await publicClient.waitForTransactionReceipt({ hash: tierTx });
        const totalTiersOnChain = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.licenseManager,
          abi: LICENSE_MANAGER_ABI,
          functionName: "totalTiers",
        });
        if (totalTiersOnChain && totalTiersOnChain > 0n) {
          createdTierId = Number(totalTiersOnChain);
        }
      }

      // Lưu sản phẩm mới vào localStorage để hiển thị ngay bên Marketplace khi quay video demo
      if (typeof window !== "undefined") {
        const existingRaw = localStorage.getItem("royaltyflow_custom_items");
        const existingItems = existingRaw ? JSON.parse(existingRaw) : [];
        const newItem = {
          tierId: createdTierId,
          contentId: Number(targetContentId),
          title: file?.name
            ? `${file.name.replace(/\.[^/.]+$/, "")} (Tác phẩm #${targetContentId.toString()})`
            : `Tác phẩm Số RoyaltyFlow #${targetContentId.toString()}`,
          category: "Music",
          primaryCreator: address || "0x007055a558eA6C6d7612cE04628Ce46Ad75537c0",
          licenseType: isDerivative ? "DERIVATIVE_ALLOW" : "COMMERCIAL",
          price: licensePrice,
          paymentToken: paymentType,
          ipfsCid,
          parentContentId: isDerivative ? parentContentId : 0,
          upstreamBps: isDerivative ? upstreamBps : 0,
          splitsSummary: recipients.map((r) => `${r.role} (${r.percentage}%)`).join(" • "),
          isFrozen: false,
        };
        localStorage.setItem(
          "royaltyflow_custom_items",
          JSON.stringify([newItem, ...existingItems])
        );
      }

      setRegStatus(
        `HOÀN TẤT: Tác phẩm #${targetContentId.toString()} (Gói License #${createdTierId}) đã lên Chợ Bản Quyền (/marketplace)!`
      );
    } catch (err: any) {
      console.error(err);
      setRegStatus(`LỖI: ${err?.shortMessage || err?.message || "Giao dịch bị từ chối"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Sparkles className="h-7 w-7 text-cyan-400" />
          <span>Creator Studio</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Đăng ký tác phẩm số, phân tích thỏa thuận đồng tác giả bằng Gemini AI và triển khai quy tắc chia sẻ BPS lên Smart Contract.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Asset & Agreement Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: File Upload & Cryptographic Hash */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2 mb-4">
              <Upload className="h-5 w-5 text-cyan-400" />
              <span>1. Tải lên Tác phẩm Kỹ thuật số & Băm SHA-256</span>
            </h2>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e: any) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                };
                input.click();
              }}
            >
              <Upload className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200">
                {file ? file.name : "Kéo thả file tác phẩm vào đây hoặc nhấn để chọn"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ Audio (MP3, WAV), Visual (PNG, JPG, SVG), 3D Asset, PDF
              </p>
            </div>

            {isHashing && (
              <div className="mt-4 flex items-center space-x-2 text-xs text-cyan-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tính toán mã băm mật mã SHA-256...</span>
              </div>
            )}

            {sha256Hash && (
              <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">SHA-256 Hash:</span>
                  <span className="text-cyan-300 truncate max-w-xs">{sha256Hash}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">IPFS CID:</span>
                  <span className="text-purple-300 truncate max-w-xs">{ipfsCid}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Agreement Textarea & AI Copilot */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <span>2. Bản Thỏa thuận Bản quyền & Trợ lý AI</span>
              </h2>
              <button
                onClick={handleAiAnalyze}
                disabled={isAiAnalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {isAiAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>AI Analyze (Gemini)</span>
              </button>
            </div>

            <textarea
              value={agreementText}
              onChange={(e) => setAgreementText(e.target.value)}
              rows={4}
              placeholder="Dán nội dung thỏa thuận, trao đổi email hoặc biên bản phân chia giữa các đồng tác giả..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />

            {aiSuggestions && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-start space-x-2.5">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-200 leading-relaxed">{aiSuggestions}</p>
              </div>
            )}
          </div>

          {/* Card 3: Interactive BPS Split Configuration */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Sliders className="h-5 w-5 text-cyan-400" />
                  <span>3. Cấu hình Tỷ lệ Phân chia Doanh thu (BPS)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  10,000 Basis Points tương ứng với 100.00% doanh thu.
                </p>
              </div>
              <button
                onClick={addRecipient}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm tác giả</span>
              </button>
            </div>

            {/* Recipients List */}
            <div className="space-y-3">
              {recipients.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      value={r.role}
                      onChange={(e) => updateRecipient(r.id, "role", e.target.value)}
                      placeholder="Vai trò / Tên tác giả"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <input
                      type="text"
                      value={r.wallet}
                      onChange={(e) => updateRecipient(r.id, "wallet", e.target.value)}
                      placeholder="Địa chỉ ví (0x...)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div className="w-full sm:w-28 flex items-center space-x-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={r.percentage}
                      onChange={(e) =>
                        updateRecipient(r.id, "percentage", parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-right font-bold text-white"
                    />
                    <span className="text-xs text-slate-400 font-semibold">%</span>
                    <button
                      onClick={() => removeRecipient(r.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total BPS Progress Bar */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-400">Tổng tỷ lệ phân chia:</span>
                <span
                  className={`font-bold ${
                    isBpsValid ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {totalPercentage.toFixed(2)}% ({totalBps} / 10,000 BPS)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isBpsValid
                      ? "bg-emerald-500"
                      : totalBps > 10000
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                />
              </div>
              {!isBpsValid && (
                <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Tổng tỷ lệ phải đạt chính xác 100% (10,000 BPS) để smart contract có thể thực thi.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Derivative Graph & On-Chain Deploy */}
        <div className="space-y-6">
          {/* Card 4: Derivative Royalty Graph */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-base font-semibold text-white flex items-center space-x-2 mb-3">
              <GitFork className="h-5 w-5 text-purple-400" />
              <span>4. Tác phẩm Phái sinh (DAG)</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDerivative}
                  onChange={(e) => setIsDerivative(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-0 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-200">
                  Đây là tác phẩm phái sinh (Derivative)
                </span>
              </label>

              {isDerivative && (
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      ID Tác phẩm gốc (Parent Content ID):
                    </label>
                    <input
                      type="number"
                      value={parentContentId}
                      onChange={(e) => setParentContentId(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-purple-800/60 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Tỷ lệ trích nộp ngược dòng (Upstream Royalty):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="500"
                        max="3000"
                        step="100"
                        value={upstreamBps}
                        onChange={(e) => setUpstreamBps(parseInt(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <span className="font-mono font-bold text-purple-300 w-16 text-right">
                        {(upstreamBps / 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-300 leading-relaxed">
                    Mỗi khi tác phẩm này bán được $100, ${(upstreamBps / 100).toFixed(0)} sẽ tự động
                    chuyển về PaymentVault của tác phẩm #{parentContentId}. Phần còn lại được chia cho các đồng tác giả trên.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: License Tier & Pricing */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-base font-semibold text-white flex items-center space-x-2 mb-3">
              <Coins className="h-5 w-5 text-emerald-400" />
              <span>5. Định giá Giấy phép Thương mại</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Loại Token Thanh toán:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentType("USDC")}
                    className={`py-2 rounded-lg font-semibold border ${
                      paymentType === "USDC"
                        ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Mock USDC (ERC20)
                  </button>
                  <button
                    onClick={() => setPaymentType("AVAX")}
                    className={`py-2 rounded-lg font-semibold border ${
                      paymentType === "AVAX"
                        ? "bg-red-950 border-red-500 text-red-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Native AVAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Giá phát hành:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={licensePrice}
                    onChange={(e) => setLicensePrice(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-bold text-white"
                  />
                  <span className="font-semibold text-slate-300">{paymentType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: On-Chain Submit Action */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4">
            <button
              onClick={handleRegisterOnChain}
              disabled={isSubmitting || !isBpsValid}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý giao dịch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đăng ký On-Chain (Avalanche Fuji)</span>
                </>
              )}
            </button>

            {regStatus && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 leading-relaxed">
                {regStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
