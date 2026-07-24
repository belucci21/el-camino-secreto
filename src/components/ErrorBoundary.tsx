"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { StaticFallback } from "./StaticFallback";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Experience fallback activated", error, info);
  }

  render() {
    return this.state.failed ? <StaticFallback /> : this.props.children;
  }
}
