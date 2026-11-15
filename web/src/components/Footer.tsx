import Link from "next/link";
import { ExternalLink, ShieldCheck, Cpu, Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-10 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <span className="text-base font-bold text-white tracking-tight">RoyaltyFlow</span>
            <p className="text-slate-400 leading-relaxed">
              Nền tảng phân phối doanh thu bản quyền số phi tập trung kết hợp Smart Contracts trên Avalanche Fuji & AI Co-pilot phân tích thỏa thuận.
            </p>
            <div className="flex items-center space-x-1.5 text-cyan-400 font-mono text-[11px]">
              <ShieldCheck className="h-4 w-4" />
              <span>Non-custodial Pull Payment</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Ứng Dụng</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/studio" className="hover:text-cyan-400 transition-colors">
                  Creator Studio & BPS Setup
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-cyan-400 transition-colors">
                  License Marketplace
                </Link>
              </li>
              <li>
                <Link href="/agreements/sign" className="hover:text-cyan-400 transition-colors">
                  HITL Signature Verification
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Revenue & Claim Dashboard
                </Link>
              </li>
              <li>
                <Link href="/graph" className="hover:text-cyan-400 transition-colors">
                  Derivative DAG Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Blockchain & Tech */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Hạ Tầng Công Nghệ</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-1.5">
                <Cpu className="h-3.5 w-3.5 text-red-400" />
                <span>Avalanche Fuji C-Chain (43113)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>FastAPI + Gemini 1.5 Pro</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>OpenZeppelin v5.1 Contracts</span>
              </li>
            </ul>
          </div>

          {/* Smart Contract Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Tài Nguyên & On-Chain</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://testnet.snowtrace.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-cyan-400 transition-colors"
                >
                  <span>Snowtrace Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.avax.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-cyan-400 transition-colors"
                >
                  <span>Avalanche Testnet Faucet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-4">
          <p>© 2026 RoyaltyFlow (project_h15). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
              v1.0.0 Production Spec
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
