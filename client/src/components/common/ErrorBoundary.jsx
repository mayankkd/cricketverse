import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CRICKETVERSE ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stadium-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stadium-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="font-display font-black text-2xl uppercase text-white tracking-wide">
              ARENA RENDER ERROR
            </h1>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred in the arena interface.'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 shadow-gold-glow"
              >
                <RefreshCw className="w-4 h-4" /> RELOAD PAGE
              </button>
              <button
                onClick={this.handleGoHome}
                className="bg-stadium-950 hover:bg-stadium-800 text-slate-300 font-display uppercase font-bold text-xs px-4 py-2.5 rounded-xl border border-stadium-700 flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" /> HOME
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

