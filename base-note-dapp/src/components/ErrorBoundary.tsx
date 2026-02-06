"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can report this to an error service if needed
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="font-medium text-red-600">Something went wrong</div>
          <div className="text-zinc-600 break-words">
            {this.state.error?.message ?? "Unknown error"}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/10"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
