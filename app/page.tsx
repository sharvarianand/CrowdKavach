import Link from "next/link";
import { Shield, Activity, Eye, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a101f]/80 backdrop-blur-md border-b border-cyan-900/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-400 fill-cyan-950" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              CROWD<span className="text-cyan-400">KAVACH</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="/api/auth/login" className="px-5 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-sm">
              Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-150 bg-cyan-500/10 rounded-full blur-[100px] opacity-50"></div>
          <div className="absolute top-[20%] right-[10%] w-125 h-125 bg-purple-500/10 rounded-full blur-[100px] opacity-30"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-size-[60px_60px] opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SYSTEM OPERATIONAL
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-slate-400">Advanced Crowd</span>
              <br />
              <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">Safety Intelligence</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              CrowdKavach deploys next-generation computer vision to provide real-time crowd analytics, anomaly detection, and automated safety protocols for public spaces.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="/api/auth/login" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 group">
                Launch Console
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="pt-8 flex items-center gap-6 text-sm text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Low Latency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative lg:h-150 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-125">
              {/* Abstract HUD Circles */}
              <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-4 border border-cyan-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="absolute inset-12 border border-purple-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>

              {/* Floating Cards */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-80 bg-[#0f1729]/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-2xl skew-y-6 animate-float">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-[10px] text-emerald-500 font-mono">SECURE</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-24 bg-cyan-900/20 rounded border border-cyan-500/20 relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 w-full h-full bg-linear-to-t from-cyan-500/20 to-transparent"></div>
                    </div>
                    <div className="h-2 w-3/4 bg-slate-700/50 rounded"></div>
                    <div className="h-2 w-1/2 bg-slate-700/50 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-32 bg-[#0a101f]/90 backdrop-blur-md border border-purple-500/30 rounded-lg p-3 shadow-xl -skew-y-3 translate-x-12 animate-float-delayed">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-300">Activity Spike</span>
                </div>
                <div className="text-2xl font-mono text-white">98.4%</div>
                <div className="text-[10px] text-slate-400">Confidence Score</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-[#0a101f]/50 border-t border-cyan-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Tactical Capabilities</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Engineered for high-density environments requiring immediate situational awareness.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Eye, title: "Computer Vision", desc: "Real-time object detection and tracking with multi-camera re-identification support." },
              { icon: Activity, title: "Crowd Analytics", desc: "Predictive modeling for density estimation and flow pattern analysis." },
              { icon: Lock, title: "Secure Infrastructure", desc: "End-to-end encrypted video pipelines with zero-trust architecture." }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-[#0f1729] border border-cyan-900/30 hover:border-cyan-500/50 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
