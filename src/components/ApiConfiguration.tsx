"use client";

import { useState, useEffect } from "react";

export default function ApiConfiguration() {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Set initial state - we'll check the actual connection when testing
    setConnectionStatus("idle");
  }, []);

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("testing");
    setError(null);

    try {
      // Call our API route instead of the service directly
      const response = await fetch("/api/tokenization/test-connection");
      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus("success");
      } else {
        setConnectionStatus("failed");
        setError(data.error || "API connection test failed");
      }
    } catch (err) {
      setConnectionStatus("failed");
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-[var(--retro-success)]";
      case "failed":
        return "text-[var(--retro-error)]";
      case "testing":
        return "text-[var(--retro-info)]";
      case "no-config":
        return "text-[var(--retro-warning)]";
      default:
        return "text-[var(--retro-text-muted)]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✓";
      case "failed":
        return "✕";
      case "testing":
        return "⟳";
      default:
        return "○";
    }
  };

  return (
    <div className="terminal p-6">
      <div
        className={`flex items-center justify-between ${isCollapsed ? "mb-0" : "mb-4"}`}
      >
        <h3 className="text-lg font-medium text-[var(--retro-text-muted)]">
          API Configuration
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[var(--retro-text-muted)] hover:text-[var(--retro-text)] transition-colors"
        >
          {isCollapsed ? "▼" : "▲"}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Configuration Display */}
          <div className="space-y-4 mb-6">
            <div className="bg-[var(--retro-surface)] p-4 rounded-lg border border-[var(--retro-border)]">
              <h4 className="font-medium text-[var(--retro-text)] mb-2">
                Tokenization API Status
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[var(--retro-text-muted)]">
                    Status:
                  </span>
                  <div className="text-[var(--retro-text)]">
                    Environment variables are configured and API routes are
                    available
                  </div>
                </div>
                <div>
                  <span className="text-[var(--retro-text-muted)]">Note:</span>
                  <div className="text-[var(--retro-text)] text-xs">
                    API calls are now handled server-side for security
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Test */}
          <div className="bg-[var(--retro-surface)] p-4 rounded-lg border border-[var(--retro-border)]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-[var(--retro-text)]">
                Connection Test
              </h4>
              <div
                className={`flex items-center space-x-2 ${getStatusColor(
                  connectionStatus,
                )}`}
              >
                <span className="text-lg">
                  {getStatusIcon(connectionStatus)}
                </span>
                <span className="text-sm capitalize">{connectionStatus}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="btn-retro px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? "Testing..." : "Test Connection"}
              </button>

              {error && (
                <div className="text-sm text-[var(--retro-error)]">
                  Error: {error}
                </div>
              )}
            </div>
          </div>

          {/* Environment Variables Info */}
          <div className="mt-6 p-4 bg-[var(--retro-surface-2)] rounded-lg border border-[var(--retro-border)]">
            <h4 className="font-medium text-[var(--retro-text)] mb-2">
              Environment Variables
            </h4>
            <div className="text-xs text-[var(--retro-text-muted)] space-y-1">
              <div>
                Make sure you have a{" "}
                <code className="bg-[var(--retro-bg)] px-1 rounded">
                  .env.local
                </code>{" "}
                file with:
              </div>
              <div className="font-mono text-[var(--retro-text)]">
                TOKENIZATION_API_URL=your_api_url
                <br />
                TOKENIZATION_API_USERNAME=your_username
                <br />
                TOKENIZATION_API_PASSWORD=your_password
                <br />
                IPFS_GATEWAY=your_ipfs_gateway
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
