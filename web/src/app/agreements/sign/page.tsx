"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import {
  FileCheck2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Loader2,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

interface PendingAgreement {
  id: string;
  contentId: number;
  title: string;
  leadCreator: string;
  userRole: string;
  userBps: number;
  userPercentage: number;
  totalRecipients: number;
  sha256Hash: string;
  ipfsCid: string;
  hitlExplanation: string;
  isSigned: boolean;
  signature?: string;
}

export default function SignAgreementsPage() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [signingId, setSigningId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [agreements, setAgreements] = useState<PendingAgreement[]>([
    {
      id: "agr-101",
      contentId: 1,
      title: "Cyberpunk Ambient Soundtrack EP",
      leadCreator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      userRole: "Ca sĩ chính & Đồng sáng tác (Tác giả B)",
      userBps: 3000,
      userPercentage: 30.0,
      totalRecipients: 3,
      sha256Hash: "0x34a1b8c7...9f82d1",
      ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      hitlExplanation:
        "Bản tóm tắt HITL do Gemini AI phân tích: Bạn đang được định danh làm Ca sĩ chính của tác phẩm #1. Với mỗi 100 USDC doanh thu phát sinh từ việc bán bản quyền, hợp đồng thông minh PaymentVault sẽ tự động ghi có chính xác 30.00 USDC vào số dư khả dụng của bạn. Không ai (kể cả tác giả chính) có thể đơn phương thay đổi tỷ lệ này sau khi bạn ký.",
      isSigned: false,
    },
    {
      id: "agr-102",
      contentId: 2,
      title: "Lo-Fi Cyberpunk Remix Edition (Phái sinh)",
      leadCreator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      userRole: "Chủ sở hữu tác phẩm gốc kế thừa",
      userBps: 2000,
      userPercentage: 20.0,
      totalRecipients: 2,
      sha256Hash: "0x7c92b1a4...4e11fa",
      ipfsCid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
      hitlExplanation:
        "Bản tóm tắt HITL do Gemini AI phân tích: Đây là thỏa thuận phái sinh từ tác phẩm gốc của bạn. Khi tác phẩm phái sinh bán được $100, $20 sẽ tự động chảy về PaymentVault của tác phẩm gốc và tiếp tục chia cho bạn theo tỷ lệ gốc.",
      isSigned: true,
      signature:
        "0x4b78a9c2df3108c5e0b674a9f8e3d21c5b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d1b",
    },
  ]);

  // EIP-712 Signing Flow
  const handleSignAgreement = async (agr: PendingAgreement) => {
    if (!isConnected || !address) {
      alert("Vui lòng kết nối ví Web3 trước khi ký!");
      return;
    }

    setSigningId(agr.id);
    setStatusMsg(`Đang khởi tạo thông điệp EIP-712 cho "${agr.title}"...`);

    try {
      // EIP-712 Typed Data Domain & Types definition
      const domain = {
        name: "RoyaltyFlow",
        version: "1",
        chainId: 43113, // Avalanche Fuji
        verifyingContract: CONTRACT_ADDRESSES.royaltySplitter,
      } as const;

      const types = {
        RoyaltyAgreement: [
          { name: "contentId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "bpsShare", type: "uint256" },
          { name: "agreementNonce", type: "uint256" },
        ],
      } as const;

      const message = {
        contentId: BigInt(agr.contentId),
        recipient: address as `0x${string}`,
        bpsShare: BigInt(agr.userBps),
        agreementNonce: 1n,
      };

      setStatusMsg("Vui lòng xác nhận ký thông điệp trên ví của bạn (MetaMask/Core)...");

      const sig = await signTypedDataAsync({
        domain,
        types,
        primaryType: "RoyaltyAgreement",
        message,
      });

      // Update local state to signed
      setAgreements((prev) =>
        prev.map((item) =>
          item.id === agr.id ? { ...item, isSigned: true, signature: sig } : item
        )
      );

      setStatusMsg(
        `KÝ THÀNH CÔNG: Chữ ký EIP-712 đã được ghi nhận và lưu trữ bằng chứng xác thực!`
      );
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Ký thất bại: ${err?.shortMessage || err?.message || "Người dùng từ chối ký"}`);
    } finally {
      setSigningId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <FileCheck2 className="h-7 w-7 text-cyan-400" />
          <span>Ký Xác Thực Thỏa Thuận (HITL Consensus)</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Nguyên tắc Human-in-the-Loop: AI phân tích và diễn giải thỏa thuận, nhưng các đồng tác giả bắt buộc phải ký số EIP-712 để kích hoạt on-chain.
        </p>
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-cyan-800/60 text-xs font-mono text-cyan-200 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <div className="space-y-6">
        {agreements.map((agr) => {
          const isSigning = signingId === agr.id;

          return (
            <div
              key={agr.id}
              className={`rounded-2xl border p-6 sm:p-8 transition-all ${
                agr.isSigned
                  ? "bg-slate-900/30 border-slate-800/80"
                  : "bg-slate-900/60 border-cyan-500/40 shadow-lg shadow-cyan-950/20"
              }`}
            >
              {/* Header: Title and Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-800 text-slate-300">
                      Tác phẩm #{agr.contentId}
                    </span>
                    <h3 className="text-lg font-bold text-white">{agr.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Tác giả khởi tạo: {agr.leadCreator}
                  </p>
                </div>

                <div>
                  {agr.isSigned ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã Ký Xác Thực (EIP-712)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-800/50 text-amber-400 text-xs font-semibold">
                      <Clock className="h-4 w-4" />
                      <span>Chờ Bạn Ký Xác Nhận</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Share Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Vai trò của bạn:</span>
                  <div className="text-sm font-bold text-white mt-1">{agr.userRole}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Tỷ lệ được hưởng:</span>
                  <div className="text-sm font-bold text-cyan-400 mt-1">
                    {agr.userPercentage.toFixed(1)}% ({agr.userBps} BPS)
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Mỗi $100 doanh thu:</span>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    Nhận chính xác ${agr.userPercentage.toFixed(2)} USDC
                  </div>
                </div>
              </div>

              {/* AI HITL Explainer Card */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 mb-6">
                <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs mb-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>Diễn giải Minh bạch Pháp lý (Gemini HITL Explainer):</span>
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  {agr.hitlExplanation}
                </p>
              </div>

              {/* Signature Stamp / Action */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-mono text-slate-400 truncate max-w-md">
                  {agr.isSigned && agr.signature ? (
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span className="truncate">Chữ ký: {agr.signature}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">
                      Chưa có chữ ký mật mã cho địa chỉ ví này.
                    </span>
                  )}
                </div>

                {!agr.isSigned && (
                  <button
                    onClick={() => handleSignAgreement(agr)}
                    disabled={isSigning}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang đợi ví xác nhận...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="h-4 w-4" />
                        <span>Ký Xác Thực (EIP-712 Signature)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
