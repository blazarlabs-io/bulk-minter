"use client";

import { useState, useEffect, useRef } from "react";
import BatchMintingTest from "@/components/BatchMintingTest";
import ApiConfiguration from "@/components/ApiConfiguration";
import { Winery } from "@/types/minting";
import { loadWineriesData } from "@/lib/dataLoader";
import Image from "next/image";

export default function HomePage() {
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingCompletedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log("[HOMEPAGE] Starting to load wineries data...");
        if (isMounted) setLoading(true);
        const data = await loadWineriesData();
        console.log(
          "[HOMEPAGE] Successfully loaded wineries data:",
          data.length,
          "wineries"
        );
        console.log("[HOMEPAGE] First winery:", data[0]);
        if (isMounted) {
          setWineries(data);
          setLoading(false);
          loadingCompletedRef.current = true;
        }
      } catch (err) {
        console.error("[HOMEPAGE] Error loading wineries data:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load wineries data"
          );
          setLoading(false);
          loadingCompletedRef.current = true;
        }
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && !loadingCompletedRef.current) {
        console.error("[HOMEPAGE] Loading timeout - forcing error state");
        setError("Loading timeout - please check your connection and reload");
        setLoading(false);
        loadingCompletedRef.current = true;
      }
    }, 15000); // 15 second timeout

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log(
      "[HOMEPAGE] State changed - loading:",
      loading,
      "wineries:",
      wineries.length,
      "error:",
      error
    );
  }, [loading, wineries.length, error]);

  if (loading) {
    return (
      <main className="min-h-screen matrix-bg py-12">
        {/* Test CSS element */}
        <div
          className="test-red test-large"
          style={{ margin: "20px", textAlign: "center" }}
        >
          🧪 CSS TEST - If you see this with red text, yellow background, and
          blue border, CSS is working!
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="retro-spinner h-32 w-32 mx-auto"></div>
            <p className="mt-4 text-lg text-[var(--retro-text-muted)]">
              Loading wineries data...
            </p>
            <div className="mt-2 text-sm text-[var(--retro-accent)]">
              System initializing
            </div>
            <div className="mt-4 text-xs text-[var(--retro-text-muted)]">
              Check browser console for details
            </div>
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-[var(--retro-surface)] rounded-lg p-4 border border-[var(--retro-border)]">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-[var(--retro-accent)] rounded-full animate-pulse"></div>
                  <span className="text-sm text-[var(--retro-text-muted)]">
                    Connecting to API...
                  </span>
                </div>
                <div className="w-full bg-[var(--retro-border)] rounded-full h-2">
                  <div
                    className="bg-[var(--retro-accent)] h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-[var(--retro-text-muted)]">
              If this takes too long, check the console for errors
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen matrix-bg py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="terminal p-8 max-w-md mx-auto">
              <div className="text-[var(--retro-error)] text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-[var(--retro-error)] mb-2">
                System error
              </h2>
              <p className="text-[var(--retro-text)]">{error}</p>
              <div className="mt-4 text-sm text-[var(--retro-accent)]">
                Error code: DATA_LOAD_FAILURE
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn-retro px-4 py-2 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen matrix-bg py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-full flex items-center justify-center">
            <Image src="/logo.svg" width={196} height={80} alt="" />
          </div>
          <h1 className="mt-12 text-4xl font-bold tracking-tight text-[var(--retro-accent)] sm:text-5xl md:text-6xl">
            Bulk minter
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-[var(--retro-text-muted)] sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Efficiently tokenize and mint multiple assets in bulk on the Cardano
            blockchain
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <a
                href="#batch-minting-test"
                className="btn-retro w-full flex items-center justify-center px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10"
              >
                Start minting
              </a>
            </div>
          </div>
        </div>

        {/* API Configuration Section */}
        <div className="mb-6">
          <ApiConfiguration />
        </div>

        {/* Batch Minting Test Section */}
        <div id="batch-minting-test" className="w-full">
          {wineries.length > 0 ? (
            <BatchMintingTest wineries={wineries} />
          ) : (
            <div className="terminal p-8 text-center w-full">
              <div className="text-[var(--retro-text-muted)] text-lg mb-4">
                No wineries found
              </div>
              <p className="text-[var(--retro-text-muted)] text-sm">
                The API returned {wineries.length} wineries. Check the console
                for debugging information.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn-retro px-4 py-2 text-sm"
              >
                Reload
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
