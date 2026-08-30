import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Upload,
  Layers,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  Search,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const scrollToFeatures = () => {
    const el = document.getElementById('features-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      title: 'Domain Detection',
      description: 'Automatically classifies contract domain (NDA, Employment, SaaS, Licensing, Procurement) using chunk aggregation NLP.',
      icon: Layers,
      color: 'bg-pastel-indigo text-pastel-indigo-dark border-pastel-indigo-dark/20',
    },
    {
      title: 'Risk Analysis',
      description: 'Evaluates contractual risks across liability, indemnification, termination, and warranties with calibrated risk scores.',
      icon: AlertTriangle,
      color: 'bg-risk-high-bg text-risk-high-text border-risk-high-text/30',
    },
    {
      title: 'Clause Analysis',
      description: 'Extracts critical clauses, compares semantic similarity against standard legal baselines, and flags non-standard terms.',
      icon: Search,
      color: 'bg-risk-low-bg text-risk-low-text border-risk-low-text/30',
    },
    {
      title: 'Contract Comparison',
      description: 'Highlights key operational differences and risk variations between target agreements and baseline contracts.',
      icon: FileCheck,
      color: 'bg-pastel-indigo text-pastel-indigo-dark border-pastel-indigo-dark/20',
    },
    {
      title: 'AI-Powered Insights',
      description: 'Natural Language Inference (NLI) model provides actionable recommendations and quoted text evidence for every risk.',
      icon: Brain,
      color: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-text/30',
    },
  ];

  return (
    <div className="min-h-screen bg-pastel-lavender text-slate-800 flex flex-col selection:bg-pastel-indigo selection:text-pastel-indigo-dark">
      {/* Top Header */}
      <header className="h-20 border-b border-pastel-lilac bg-white sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-pastel-lilac flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6 text-pastel-indigo-dark" />
          </div>
          <span className="text-xl font-extrabold text-slate-900">
            ContractGuard
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/upload"
            className="px-5 py-2.5 rounded-xl bg-pastel-indigo-dark text-white hover:bg-indigo-600 text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/20 flex items-center space-x-2 transition-all"
          >
            <span>Analyze Contract</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center bg-pastel-lavender">
        <div className="max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pastel-indigo text-pastel-indigo-dark text-xs font-extrabold border border-pastel-indigo-dark/20">
            <Sparkles className="w-4 h-4 text-pastel-indigo-dark" />
            <span>Next-Generation Legal Intelligence</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            ContractGuard — <br />
            <span className="text-pastel-indigo-dark">
              AI-Powered Contract Risk Analysis
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Upload your contract to identify its domain, analyze important clauses, and detect potential risk factors with state-of-the-art NLP models.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/upload"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-pastel-indigo-dark text-white hover:bg-indigo-600 text-sm font-extrabold shadow-lg shadow-pastel-indigo-dark/25 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <Upload className="w-5 h-5" />
              <span>Analyze Contract</span>
            </Link>

            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-pastel-lilac hover:bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/30 text-sm font-extrabold shadow-sm transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features-grid" className="py-20 px-8 bg-white border-t border-pastel-lilac">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Complete Legal Risk Intelligence Suite
            </h2>
            <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto font-medium">
              Built on deep Transformer architectures to deliver instant clause auditing, risk scoring, and evidence extraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-pastel-lilac rounded-2xl p-6 hover:border-pastel-indigo-dark transition-all duration-200 shadow-sm hover:shadow-md group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl border ${feature.color} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-pastel-indigo-dark transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                  <div className="pt-6 flex items-center text-xs text-pastel-indigo-dark font-extrabold space-x-1">
                    <span>Explore Feature</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <footer className="mt-auto border-t border-pastel-lilac bg-white py-8 px-8 text-center text-xs text-slate-600 space-y-2">
        <div className="flex justify-center items-center space-x-2 text-slate-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-risk-low-text" />
          <span>Client-Side UUID Tracking & Stateless Privacy Protection</span>
        </div>
        <p>&copy; {new Date().getFullYear()} ContractGuard AI Engine. All rights reserved.</p>
      </footer>
    </div>
  );
};
