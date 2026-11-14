import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-[#09090D] text-slate-900 dark:text-slate-100">
          <div className="max-w-sm w-full rounded-3xl p-6 glass-surface text-center space-y-4">
            <h1 className="text-lg font-bold">Impulso</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ocorreu um erro ao carregar os dados salvos no navegador. Você pode limpar os dados locais e reiniciar.
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('impulso_app_state_v5');
                } catch {
                  // ignore storage errors
                }
                window.location.reload();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl accent-bg text-xs font-semibold"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
