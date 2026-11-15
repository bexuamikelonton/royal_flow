import Link from "next/link";
import {
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowRight,
  ShieldCheck,
  GitFork,
  FileCheck2,
  Coins,
  Scale,
  Cpu,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: GitFork,
      title: "Derivative Royalty Graph",
      desc: "Quản trị phân bổ doanh thu đa thế hệ cho tác phẩm phái sinh (DAG). Trích tỷ lệ % ngược dòng cho tác phẩm gốc tự động, chống chia trùng lặp.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Scale,
      title: "Độ chính xác Basis Points (BPS)",
      desc: "Quy chuẩn tỷ lệ phân chia dựa trên cơ số 10,000 bps (100.00%). Loại bỏ hoàn toàn sai số làm tròn và tranh chấp số dư giữa các đồng tác giả.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Cpu,
      title: "AI Co-pilot với Human-in-the-Loop",
      desc: "Google Gemini tự động bóc tách bản thỏa thuận tự do thành JSON Schema chuẩn Smart Contract. Bắt buộc đồng tác giả ký mật mã EIP-712.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: ShieldCheck,
      title: "Két thanh toán Pull-Payment",
      desc: "Thiết kế PaymentVault theo mẫu Pull-over-Push bảo vệ hệ thống khỏi tấn công DoS / Out-of-gas. Tác giả chủ động rút tiền về ví mọi lúc.",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Đăng ký & Băm SHA-256",
      desc: "Nhà sáng tạo tải lên nội dung số. Hệ thống tính toán mã băm SHA-256 off-chain và lưu trữ CID trên IPFS.",
    },
    {
      step: "02",
      title: "AI Phân tích Thỏa thuận",
      desc: "Agent bóc tách danh sách đồng tác giả, tỷ lệ BPS và phát hiện xung đột hoặc vòng lặp phái sinh.",
    },
    {
      step: "03",
      title: "HITL Ký xác thực EIP-712",
      desc: "Các đồng tác giả xem bản giải thích trực quan và ký xác thực bằng ví Web3 (Metamask, Core) trước khi khóa on-chain.",
    },
    {
      step: "04",
      title: "Phân phối Tức thì khi Mua",
      desc: "Khách hàng mua giấy phép (USDC/AVAX). Hợp đồng thông minh phân bổ doanh thu ngay lập tức vào số dư rút được.",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 flex flex-col items-center text-center">
        {/* Glow background effects */}
        <div className="absolute top-1/4 -z-10 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -z-10 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "6s" }} />
          <span>RoyaltyFlow v1.0 • Avalanche Fuji C-Chain & Gemini AI</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight sm:leading-tight">
          Phân Phối Doanh Thu Bản Quyền Số{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Minh Bạch & Tức Thì
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Giải pháp Web3 giải quyết triệt để vấn đề phân chia doanh thu giữa nhiều đồng tác giả,
          tự động hóa luồng trích nộp ngược dòng cho tác phẩm phái sinh thông qua Smart Contract và AI Agent.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/studio"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Mở Creator Studio</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
          <Link
            href="/marketplace"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold text-sm transition-all"
          >
            <ShoppingBag className="h-4 w-4 text-cyan-400" />
            <span>Chợ Giấy Phép Bản Quyền</span>
          </Link>
        </div>

        {/* Live Metrics bar */}
        <div className="mt-16 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
          <div className="p-3">
            <span className="text-xs text-slate-400 font-medium">Cơ số phân chia</span>
            <div className="text-xl font-bold text-white mt-1">10,000 BPS</div>
            <span className="text-[11px] text-cyan-400">Độ chính xác 100.00%</span>
          </div>
          <div className="p-3 border-l border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Bảo mật rút tiền</span>
            <div className="text-xl font-bold text-white mt-1">Pull Pattern</div>
            <span className="text-[11px] text-emerald-400">Non-Reentrant & SafeERC20</span>
          </div>
          <div className="p-3 border-l border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Đồ thị phái sinh</span>
            <div className="text-xl font-bold text-white mt-1">DAG Engine</div>
            <span className="text-[11px] text-purple-400">Cascading Upstream Split</span>
          </div>
          <div className="p-3 border-l border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Trọng tài & Tranh chấp</span>
            <div className="text-xl font-bold text-white mt-1">On-chain Freeze</div>
            <span className="text-[11px] text-amber-400">Khóa giao dịch tức thì</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Kiến Trúc Cốt Lõi Được Tối Ưu Cho Kinh Tế Sáng Tạo Số
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Kết hợp sức mạnh bất biến của Smart Contract trên Avalanche Fuji với trí tuệ nhân tạo Agentic AI của Google Gemini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all hover:bg-slate-900/60"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${f.color} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Quy trình vận hành
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Từ Thỏa Thuận Viết Tay Đến Hạch Toán On-chain Trong 4 Bước
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-2xl bg-slate-900/30 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl font-extrabold text-cyan-500/40 font-mono">
                  {step.step}
                </span>
                <h3 className="text-base font-semibold text-white mt-4">{step.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Banner */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-800/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-left">
            <h3 className="text-2xl font-bold text-white">Sẵn sàng trải nghiệm RoyaltyFlow?</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Đăng ký tác phẩm kỹ thuật số, cấu hình phân chia tỷ lệ BPS và kiếm doanh thu minh bạch trên mạng thử nghiệm Avalanche Fuji ngay hôm nay.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/studio"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all"
            >
              Khởi tạo ngay
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all"
            >
              Xem Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
