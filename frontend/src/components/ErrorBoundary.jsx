import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-card border border-border/60 shadow-lg rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              We encountered an unexpected error. Please try reloading the page. If the problem persists, contact support.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 text-left bg-muted p-4 rounded-lg overflow-auto max-h-48 text-xs text-muted-foreground border border-border/40">
                <code className="whitespace-pre-wrap font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <Button onClick={this.handleReload} className="w-full gap-2">
              <RefreshCcw size={16} />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
