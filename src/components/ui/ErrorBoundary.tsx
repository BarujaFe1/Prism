"use client";

import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="px-6 pt-4 pb-16 max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">Algo deu errado</h2>
            <p className="text-sm text-text-secondary max-w-md mb-6">
              Ocorreu um erro ao carregar esta página. Tente recarregar.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
