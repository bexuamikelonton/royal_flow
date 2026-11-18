"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useBalance, injected } from "wagmi";
import { useState, useEffect } from "react";
import { DEMO_ACCOUNTS, installDemoEthereumProvider } from "@/lib/config";
import {
  Layers,
  Sparkles,
  ShoppingBag,
  FileCheck2,
  Wallet,
  LayoutDashboard,
  LogOut,
  GitFork,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, chain } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoWallet, setIsDemoWallet] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && (window as any).ethereum?.isRoyaltyFlowDemo) {
      setIsDemoWallet(true);
    }
  }, []);

  const handleConnect = async (forceDemo = false) => {
    try {
      if (
        forceDemo ||
        typeof window === "undefined" ||
        !(window as any).ethereum ||
        (window as any).ethereum?.isRoyaltyFlowDemo
      ) {
        installDemoEthereumProvider(DEMO_ACCOUNTS[0].address);
        setIsDemoWallet(true);
      }
      await connectAsync({ connector: injected() });
    } catch (err) {
      // Nếu ví trình duyệt bị khoá / từ chối / lỗi, tự động chuyển sang Ví Mô Phỏng để người dùng test mượt mà
      installDemoEthereumProvider(DEMO_ACCOUNTS[0].address);
      setIsDemoWallet(true);
      try {
        await connectAsync({ connector: injected() });
      } catch (innerErr) {
        console.error("Wallet connect error:", innerErr);
      }
    }
  };

  const handleSwitchDemoAccount = (newAddr: string) => {
    const provider = installDemoEthereumProvider(newAddr);
    setIsDemoWallet(true);
    if (provider) {
      provider.setAccount(newAddr);
    }
  };

  const navLinks = [
    { href: "/studio", label: "Studio", icon: Sparkles },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/agreements/sign", label: "Sign Agreements", icon: FileCheck2 },
    { href: "/dashboard", label: "Revenue Dashboard", icon: LayoutDashboard },
    { href: "/graph", label: "Royalty Graph", icon: GitFork },
  ];

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              RoyaltyFlow
            </span>
            <span className="text-[10px] font-medium text-cyan-400 -mt-1 tracking-wider uppercase">
              Fuji C-Chain
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-slate-800/80 text-cyan-400 shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-3">
          {mounted && isConnected && address ? (
            <div className="flex items-center space-x-2">
              {/* Role Switcher for Simulation */}
              {isDemoWallet && (
                <select
                  value={address}
                  onChange={(e) => handleSwitchDemoAccount(e.target.value)}
                  className="hidden lg:block px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-[11px] font-medium text-indigo-200 focus:outline-none cursor-pointer"
                  title="Đổi vai trò ví mô phỏng"
                >
                  {DEMO_ACCOUNTS.map((acc) => (
                    <option key={acc.address} value={acc.address} className="bg-slate-900 text-white">
                      🎭 {acc.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Chain Badge */}
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-red-950/40 border border-red-800/40 rounded-full text-[11px] font-medium text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span>{isDemoWallet ? "Fuji (Mô phỏng)" : chain?.name || "Avalanche Fuji"}</span>
              </div>

              {/* Balance & Address */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                {balanceData && (
                  <span className="px-2 py-0.5 text-slate-300 font-medium">
                    {parseFloat(balanceData.formatted).toFixed(3)} {balanceData.symbol}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono font-semibold">
                  {formatAddress(address)}
                </span>
                <button
                  onClick={() => disconnect()}
                  title="Disconnect Wallet"
                  className="p-1 ml-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleConnect(false)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
              <button
                onClick={() => handleConnect(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 font-medium text-xs transition-all cursor-pointer"
                title="Kết nối ngay bằng Ví Mô Phỏng (không cần cài MetaMask)"
              >
                <span>🎭 Ví Mô Phỏng</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-slate-800 text-cyan-400 border border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
