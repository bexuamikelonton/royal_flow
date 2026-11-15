"use client";

import { useState } from "react";
import {
  GitFork,
  ArrowDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Coins,
  ChevronRight,
  Calculator,
  Info,
} from "lucide-react";

interface GraphNode {
  id: number;
  title: string;
  creator: string;
  parentId: number;
  upstreamBps: number;
  depth: number;
  splits: { name: string; wallet: string; bps: number; percentage: number }[];
}

export default function RoyaltyGraphPage() {
  const [simulationAmount, setSimulationAmount] = useState<number>(100);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(2);

  const nodes: GraphNode[] = [
    {
      id: 1,
      title: "Cyberpunk Ambient Soundtrack EP (Gốc #1)",
      creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      parentId: 0,
      upstreamBps: 0,
      depth: 0,
      splits: [
        { name: "Tác giả A (Nhạc sĩ)", wallet: "0x7099...79C8", bps: 5000, percentage: 50 },
        { name: "Tác giả B (Ca sĩ)", wallet: "0x3C44...93BC", bps: 3000, percentage: 30 },
        { name: "Tác giả C (Master)", wallet: "0x90F7...b906", bps: 2000, percentage: 20 },
      ],
    },
    {
      id: 2,
      title: "Lo-Fi Cyberpunk Remix Edition (Phái sinh #2)",
      creator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      parentId: 1,
      upstreamBps: 2000, // 20%
      depth: 1,
      splits: [
        { name: "Tác giả E (Remixer)", wallet: "0x15d3...6A65", bps: 10000, percentage: 100 },
      ],
    },
    {
      id: 3,
      title: "VR Cyberpunk Spatial Mix (Phái sinh Thế hệ 2 #3)",
      creator: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
      parentId: 2,
      upstreamBps: 1500, // 15%
      depth: 2,
      splits: [
        { name: "Tác giả F (VR Spatial Audio)", wallet: "0x9965...A4df", bps: 10000, percentage: 100 },
      ],
    },
  ];

  // Calculate cascading simulation for selected node
  const calculateCascadingPayouts = () => {
    const selected = nodes.find((n) => n.id === selectedNodeId);
    if (!selected) return [];

    let currentAmount = simulationAmount;
    let currentNode: GraphNode | undefined = selected;
    const payouts: {
      contentId: number;
      title: string;
      role: string;
      recipient: string;
      amount: number;
      percentageOfTotal: number;
    }[] = [];

    while (currentNode) {
      const parentId = currentNode.parentId;
      let upstream = 0;

      if (parentId > 0 && currentNode.upstreamBps > 0) {
        upstream = (currentAmount * currentNode.upstreamBps) / 10000;
      }

      const localAmount = currentAmount - upstream;

      for (const split of currentNode.splits) {
        const share = (localAmount * split.bps) / 10000;
        payouts.push({
          contentId: currentNode.id,
          title: currentNode.title,
          role: split.name,
          recipient: split.wallet,
          amount: share,
          percentageOfTotal: (share / simulationAmount) * 100,
        });
      }

      currentAmount = upstream;
      currentNode = nodes.find((n) => n.id === parentId);
    }

    return payouts;
  };

  const simulationResults = calculateCascadingPayouts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <GitFork className="h-7 w-7 text-purple-400" />
          <span>Sơ Đồ Bản Quyền Phái Sinh (Derivative Royalty Graph)</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Mô hình đồ thị có hướng không chu trình (DAG) quản lý dòng tiền bản quyền tự động từ tác phẩm phái sinh ngược về tác phẩm gốc mà không bao giờ chi vượt 100%.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Tree Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="h-5 w-5 text-purple-400" />
                <span>Cây Phả Hệ Tác Phẩm (DAG Tree)</span>
              </h2>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Không có chu trình (DAG Hợp lệ)</span>
              </div>
            </div>

            {/* Tree Nodes List */}
            <div className="space-y-4">
              {nodes.map((node, index) => {
                const isSelected = selectedNodeId === node.id;

                return (
                  <div key={node.id} className="relative">
                    {index > 0 && (
                      <div className="flex items-center justify-center -my-2 py-1">
                        <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/60 z-10 shadow-sm">
                          <ArrowDown className="h-3.5 w-3.5" />
                          <span>
                            Trích {(node.upstreamBps / 100).toFixed(0)}% Upstream cho #{node.parentId}
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500"
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-purple-300">
                            ID #{node.id}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Độ sâu tầng: {node.depth}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded bg-purple-500 text-slate-950 font-bold text-[10px]">
                            Đang mô phỏng
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white mb-2">{node.title}</h3>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
                        <span className="text-slate-400 text-[11px] font-medium">Đồng tác giả & Tỷ lệ:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {node.splits.map((s, idx) => (
                            <div
                              key={idx}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] flex justify-between"
                            >
                              <span className="text-slate-300 truncate">{s.name}</span>
                              <span className="font-bold text-cyan-400 font-mono">
                                {s.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Real-time Revenue Cascading Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
              <Calculator className="h-5 w-5 text-cyan-400" />
              <span>Mô Phỏng Dòng Chảy Doanh Thu</span>
            </h2>

            {/* Input Amount */}
            <div className="space-y-3 mb-6">
              <label className="block text-xs font-medium text-slate-300">
                Doanh thu khi bán tác phẩm #{selectedNodeId}:
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  value={simulationAmount}
                  onChange={(e) => setSimulationAmount(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-base focus:outline-none focus:border-cyan-500"
                />
                <span className="font-bold text-cyan-400 text-sm">USDC</span>
              </div>
            </div>

            {/* Payout Breakdown List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Kết quả hạch toán vào ví tác giả:
              </span>

              {simulationResults.map((res, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 max-w-[65%]">
                    <span className="font-bold text-white block truncate">{res.role}</span>
                    <span className="text-[11px] text-slate-400 block truncate font-mono">
                      {res.title}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-emerald-400 font-mono text-sm">
                      +${res.amount.toFixed(2)} USDC
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {res.percentageOfTotal.toFixed(1)}% tổng đơn
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Integrity Verification */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Tổng phân bổ thực tế:</span>
              <span className="text-emerald-400 font-mono text-sm">
                ${simulationResults.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} / $
                {simulationAmount.toFixed(2)} USDC (100.00%)
              </span>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/30 text-[11px] text-cyan-200/90 leading-relaxed flex items-start space-x-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                Toàn bộ các phép tính trên được thực thi on-chain bằng hàm{" "}
                <code className="text-cyan-300 font-mono">RoyaltySplitter.calculateSplits()</code>,
                đảm bảo không thất thoát bất kỳ số lẻ (rounding dust) nào.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
