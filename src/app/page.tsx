"use client";

import { useState } from "react";
import BatchMintingTest from "@/components/BatchMintingTest";
import ApiConfiguration from "@/components/ApiConfiguration";
import { Winery } from "@/types/minting";
import Image from "next/image";

export default function HomePage() {
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadData = () => {
    setLoading(true);
    setError(null);

    // Simulate API call delay
    setTimeout(() => {
      setWineries([
        {
          id: "mock-winery-1",
          info: {
            name: "Mock Winery Alpha",
          },
          wines: [
            {
              uid: "mock-winery-1",
              id: "mock-wine-1",
              createdAt: "2024-01-01T00:00:00.000Z",
              status: "published",
              generalInfo: {
                wineryName: "Mock Winery Alpha",
                collectionName: "Premium Collection 2024",
                type: "red-wine",
                vintage: "2024",
                grapeVarieties: [
                  {
                    name: "Cabernet Sauvignon",
                    percentage: "100",
                    vintage: "2024",
                  },
                ],
              },
            },
            {
              uid: "mock-winery-1",
              id: "mock-wine-2",
              createdAt: "2024-01-02T00:00:00.000Z",
              status: "published",
              generalInfo: {
                wineryName: "Mock Winery Alpha",
                collectionName: "Reserve Collection 2023",
                type: "white-wine",
                vintage: "2023",
                grapeVarieties: [
                  { name: "Chardonnay", percentage: "100", vintage: "2023" },
                ],
              },
            },
          ],
        },
        {
          id: "mock-winery-2",
          info: {
            name: "Mock Winery Beta",
          },
          wines: [
            {
              uid: "mock-winery-2",
              id: "mock-wine-3",
              createdAt: "2024-01-03T00:00:00.000Z",
              status: "published",
              generalInfo: {
                wineryName: "Mock Winery Beta",
                collectionName: "Classic Collection 2024",
                type: "rose-wine",
                vintage: "2024",
                grapeVarieties: [
                  { name: "Pinot Noir", percentage: "100", vintage: "2024" },
                ],
              },
            },
          ],
        },
      ]);
      setLoading(false);
    }, 500);
  };

  return (
    <main className="min-h-screen matrix-bg py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main content */}
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
              <button
                onClick={handleLoadData}
                disabled={loading}
                className="btn-retro px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Load Wineries Data"}
              </button>
            </div>
          </div>
        </div>

        {/* API Configuration Section */}
        <div className="mb-6">
          <ApiConfiguration />
        </div>

        {/* Batch Minting Test Section */}
        <div id="batch-minting-test" className="w-full">
          {loading ? (
            <div className="text-center">
              <div className="retro-spinner h-32 w-32 mx-auto"></div>
              <p className="mt-4 text-lg text-[var(--retro-text-muted)]">
                Loading wineries data...
              </p>
              <div className="mt-2 text-sm text-[var(--retro-accent)]">
                System initializing
              </div>
            </div>
          ) : wineries.length > 0 ? (
            <BatchMintingTest wineries={wineries} />
          ) : (
            <div className="terminal p-8 text-center w-full">
              <div className="text-[var(--retro-text-muted)] text-lg mb-4">
                No wineries loaded
              </div>
              <p className="text-[var(--retro-text-muted)] text-sm">
                Click the &quot;Load Wineries Data&quot; button above to load sample data.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
