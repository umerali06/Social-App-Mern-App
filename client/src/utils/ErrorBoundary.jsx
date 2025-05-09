import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Caught error in ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-6 text-red-600 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <p>{this.state.error?.message || "Unknown error."}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
