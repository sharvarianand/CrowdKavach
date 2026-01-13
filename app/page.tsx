'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Activity, BarChart3, Bell, Camera, ArrowRight, CheckCircle, Zap, Lock, Sun, Moon, Shield } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const features = [
    { icon: Camera, title: 'Live Monitoring', desc: 'Real-time crowd surveillance with AI-powered detection' },
    { icon: Users, title: 'People Counting', desc: 'Accurate headcount tracking across multiple zones' },
    { icon: Activity, title: 'Density Analysis', desc: 'Monitor crowd density and flow patterns instantly' },
    { icon: Bell, title: 'Smart Alerts', desc: 'Instant notifications when safety thresholds are reached' },
    { icon: BarChart3, title: 'Analytics', desc: 'Comprehensive reports and actionable insights' },
    { icon: Shield, title: 'Safety First', desc: 'Proactive emergency management and response' },
  ];

  const stats = [
    { value: '99.9%', label: 'Detection Accuracy' },
    { value: '<100ms', label: 'Response Time' },
    { value: '24/7', label: 'Monitoring' },
    { value: '1000+', label: 'People Tracked' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Features</a>
            <a href="#stats" className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Stats</a>
            <a href="#about" className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">About</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-sm"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-linear-to-b from-zinc-50 dark:from-zinc-800 to-white dark:to-zinc-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6 border border-emerald-100 dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            AI-Powered Safety Solution
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 leading-tight">
            Intelligent Crowd
            <span className="text-emerald-600 dark:text-emerald-400"> Monitoring</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Advanced AI-powered crowd detection and safety management system.
            Monitor, analyze, and protect your spaces in real-time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-lg shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className={`w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all font-semibold text-lg border border-zinc-200 dark:border-zinc-700"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-6 border-y border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-12 text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="font-medium">Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Real-time Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Privacy Compliant</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-zinc-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Powerful Features</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto text-lg">Everything you need for comprehensive crowd safety management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-zinc-800 rounded-2xl hover:shadow-lg dark:hover:shadow-zinc-900/50 transition-all group cursor-pointer border border-zinc-100 dark:border-zinc-700 hover:border-emerald-200 dark:hover:border-emerald-700"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-600 transition-colors flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 px-6 bg-emerald-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-6">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-emerald-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-800/50 transition-colors duration-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Ready to enhance your crowd safety?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10 leading-relaxed">
            Join organizations that trust CrowdKavach for their crowd monitoring and safety management needs.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-10 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-lg shadow-lg shadow-emerald-600/20"
          >
            Start Monitoring Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" variant="light" />
          <div className="flex items-center gap-8 text-zinc-400">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-zinc-500">© 2026 CrowdKavach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
