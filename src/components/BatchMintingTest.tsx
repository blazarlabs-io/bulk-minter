"use client";

import { useState, useEffect, useRef } from "react";
import {
  Winery,
  Wine,
  MintingStatus,
  BatchMintingProgress,
  MintPayload,
} from "@/types/minting";
import { BatchMintingProcessor } from "@/services/batchMintingProcessor";

interface BatchMintingTestProps {
  wineries: Winery[];
}

export default function BatchMintingTest({ wineries }: BatchMintingTestProps) {
  const [processor] = useState(() => new BatchMintingProcessor());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchMintingProgress | null>(null);
  const [results, setResults] = useState<MintingStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Mint history state
  const [mintHistory, setMintHistory] = useState<Map<string, MintingStatus>>(
    new Map()
  );
  const [mintedAssets, setMintedAssets] = useState<Set<string>>(new Set());
  const [isResuming, setIsResuming] = useState(false);
  const [resumeFromIndex, setResumeFromIndex] = useState<number>(0);
  const [wasStopped, setWasStopped] = useState(false);

  // Minting mode state
  const [mintingMode, setMintingMode] = useState<"bulk" | "single">("bulk");
  const [selectedWinery, setSelectedWinery] = useState<string>("");
  const [selectedWine, setSelectedWine] = useState<string>("");
  const [availableWines, setAvailableWines] = useState<Wine[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Environment toggle state
  const [environmentMode, setEnvironmentMode] = useState<"test" | "main">(
    "test"
  );

  // Single minting flow state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageProcessingStep, setImageProcessingStep] = useState<string>("");
  const [mintPayload, setMintPayload] = useState<MintPayload | null>(null);
  const [mintResult, setMintResult] = useState<{
    txId: string;
    tokenRefId: string;
  } | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "complete" | "error" | null
  >(null);
  const [statusDetails, setStatusDetails] = useState<string>("");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [monitoringCleanup, setMonitoringCleanup] = useState<
    (() => void) | null
  >(null);

  // Use ref to track monitoring state for timers
  const monitoringRef = useRef(false);
  // Ref to avoid stale closure issues for stop flag
  const stoppedRef = useRef(false);

  // Abort controllers for in-flight requests (to support hard stop)
  const abortControllersRef = useRef<Set<AbortController>>(new Set());

  // Wrapper around fetch that registers an AbortController so we can cancel on stop
  const abortableFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    try {
      const response = await fetch(input, {
        ...(init || {}),
        signal: controller.signal,
      });
      return response;
    } finally {
      // Always remove controller when request settles
      abortControllersRef.current.delete(controller);
    }
  };

  // Debug monitoring state changes
  const setMonitoringWithLog = (value: boolean) => {
    const stackTrace = new Error().stack;
    const callerLine = stackTrace?.split("\n")[2]?.trim() || "unknown";
    addConsoleLog(
      "info",
      `🔄 Monitoring state changed: ${isMonitoring} → ${value}`
    );
    addConsoleLog("info", `📍 Called from: ${callerLine}`);
    setIsMonitoring(value);
    monitoringRef.current = value; // Update ref for timer callbacks
  };

  // Terminal console state
  const [consoleLogs, setConsoleLogs] = useState<
    Array<{
      type: "info" | "success" | "error" | "step" | "warning";
      message: string;
      timestamp: Date;
    }>
  >([]);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-scroll to bottom when new results are added (DISABLED - user should control scrolling)
  // const scrollToBottom = () => {
  //   resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // };

  // Auto-scroll terminal console to bottom when new logs are added
  const scrollConsoleToBottom = () => {
    if (consoleEndRef.current) {
      // Only scroll the console container, not the entire page
      const consoleContainer =
        consoleEndRef.current.closest(".overflow-y-auto");
      if (consoleContainer) {
        consoleContainer.scrollTop = consoleContainer.scrollHeight;
      }
    }
  };

  // Keep stoppedRef in sync with wasStopped state
  useEffect(() => {
    stoppedRef.current = wasStopped;
  }, [wasStopped]);

  // Cleanup monitoring on component unmount
  useEffect(() => {
    return () => {
      if (monitoringCleanup) {
        monitoringCleanup();
      }
    };
  }, [monitoringCleanup]);

  // Add log to terminal console
  const addConsoleLog = (
    type: "info" | "success" | "error" | "step" | "warning",
    message: string
  ) => {
    const newLog = {
      type,
      message,
      timestamp: new Date(),
    };
    setConsoleLogs((prev) => [...prev, newLog]);
  };

  // Clear console logs
  const clearConsole = () => {
    setConsoleLogs([]);
  };

  // Show toast notification
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Hide toast manually
  const hideToast = () => {
    setToast(null);
  };

  // useEffect(() => {
  //   scrollToBottom();
  // }, [progress?.mintingStatuses]);

  useEffect(() => {
    scrollConsoleToBottom();
  }, [consoleLogs]);

  useEffect(() => {
    processor.setProgressCallback((progressUpdate) => {
      setProgress(progressUpdate);

      // Update mint history with progress updates
      if (progressUpdate.mintingStatuses) {
        progressUpdate.mintingStatuses.forEach((status) => {
          addToMintHistory(status.wineId, status);
        });
      }
    });

    processor.setCompletionCallback((mintingResults) => {
      // Only update results and clear processing state if we weren't manually stopped
      if (!wasStopped) {
        setResults(mintingResults);
        setIsProcessing(false);
        setError(null);

        // Update mint history with final results
        mintingResults.forEach((status) => {
          addToMintHistory(status.wineId, status);
        });

        addConsoleLog("success", "✅ Batch minting completed successfully!");
      } else {
        // We were stopped manually, just update the mint history but don't clear results
        addConsoleLog(
          "info",
          "📚 Background processing completed - results preserved due to manual stop"
        );

        // Still update mint history for any completed items
        mintingResults.forEach((status) => {
          addToMintHistory(status.wineId, status);
        });
      }
    });

    return () => {
      if (isProcessing) {
        processor.stopBatchMinting();
      }
    };
  }, [processor, isProcessing, wasStopped]);

  const handleStartMinting = async () => {
    try {
      setError(null);
      setResults([]);
      setIsProcessing(true);
      setIsResuming(false);
      setWasStopped(false);

      const testWineries = wineries.slice(0, 3);
      let startIndex = 0;

      // Check if we're resuming from a previous session
      if (mintHistory.size > 0) {
        const resumeData = getResumeData();
        addConsoleLog(
          "info",
          `🔍 Resume check: ${resumeData.completed} completed, ${resumeData.failed} failed, ${resumeData.pending} pending, canResume: ${resumeData.canResume}`
        );

        if (resumeData.canResume) {
          setIsResuming(true);
          startIndex = resumeData.completed;
          setResumeFromIndex(startIndex);
          addConsoleLog("info", `🔄 Resuming minting from index ${startIndex}`);

          // Log what we're resuming
          if (resumeData.failed > 0) {
            addConsoleLog(
              "info",
              `🔄 Will retry ${resumeData.failed} failed assets`
            );
          }
          if (resumeData.pending > 0) {
            addConsoleLog(
              "info",
              `🔄 Will continue ${resumeData.pending} pending assets`
            );
          }
        } else {
          addConsoleLog(
            "info",
            `📚 No resume needed - all assets completed successfully`
          );
        }
      }

      console.log(
        `Starting batch minting with ${testWineries.length} wineries${
          isResuming ? ` (resuming from ${startIndex})` : ""
        }`
      );

      // Filter out only successfully minted assets, allow failed/pending to be retried
      const filteredWineries = testWineries.map((winery) => ({
        ...winery,
        wines:
          winery.wines?.filter((wine) => {
            const existingStatus = mintHistory.get(wine.id);
            // Only filter out if it was successfully minted
            return !existingStatus || existingStatus.status !== "success";
          }) || [],
      }));

      const totalAssets = filteredWineries.reduce(
        (sum, winery) => sum + (winery.wines?.length || 0),
        0
      );

      // Get detailed breakdown
      const successfulAssets = Array.from(mintHistory.values()).filter(
        (item) => item.status === "success"
      ).length;
      const failedAssets = Array.from(mintHistory.values()).filter(
        (item) => item.status === "failed"
      ).length;
      const pendingAssets = Array.from(mintHistory.values()).filter(
        (item) => item.status === "pending" || item.status === "minting"
      ).length;

      addConsoleLog("info", `📊 Total assets to mint: ${totalAssets}`);
      addConsoleLog(
        "info",
        `📊 Mint history: ${successfulAssets} successful, ${failedAssets} failed, ${pendingAssets} pending`
      );
      addConsoleLog(
        "info",
        `🔄 Resume mode: ${
          isResuming ? `Yes (from index ${startIndex})` : "No"
        }`
      );

      if (environmentMode === "main") {
        // Reset stop flag when starting a new main run
        setWasStopped(false);
        stoppedRef.current = false;
        addConsoleLog(
          "step",
          "🚀 Main Network Mode: Starting sequential minting with Blockfrost confirmation"
        );
        addConsoleLog(
          "info",
          `📊 Processing ${filteredWineries.length} wineries with sequential confirmation`
        );
        addConsoleLog(
          "info",
          `⏱️ Each transaction will wait for blockchain confirmation before proceeding`
        );
        await startMainNetworkMinting(filteredWineries, startIndex);
      } else {
        // Reset stop flag when starting test mode too
        setWasStopped(false);
        stoppedRef.current = false;
        addConsoleLog("info", "🧪 Test Mode: Starting mock batch minting");
        await processor.startBatchMinting(filteredWineries);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setIsProcessing(false);
    }
  };

  const handleStopMinting = () => {
    addConsoleLog("warning", "🛑 Stopping minting process...");
    setWasStopped(true);
    stoppedRef.current = true; // ensure immediate visibility in closures

    // Stop the processor if it's running
    if (environmentMode === "test") {
      processor.stopBatchMinting();
    }

    // Abort all in-flight network requests (image, ipfs, mint, blockfrost)
    abortControllersRef.current.forEach((c) => {
      try {
        c.abort();
      } catch {}
    });
    abortControllersRef.current.clear();

    // Set processing to false immediately
    setIsProcessing(false);

    addConsoleLog(
      "info",
      "📚 Mint history preserved - you can resume from where you left off"
    );
    addConsoleLog("info", "⏹️ All ongoing operations have been stopped");
  };

  // Main network minting function with sequential processing and Blockfrost confirmation
  const startMainNetworkMinting = async (
    wineries: Winery[],
    startIndex: number = 0
  ) => {
    try {
      // Check if we should stop before starting
      if (stoppedRef.current) {
        addConsoleLog("warning", "🛑 Minting was stopped before starting");
        return;
      }

      // Flatten all wines into a single array for sequential processing
      const allWines: Array<{ winery: Winery; wine: Wine; index: number }> = [];
      let globalIndex = 0;

      wineries.forEach((winery: Winery) => {
        if (winery.wines) {
          winery.wines.forEach((wine: Wine) => {
            allWines.push({ winery, wine, index: globalIndex++ });
          });
        }
      });

      // Filter wines based on start index and mint history
      const winesToProcess = allWines.slice(startIndex).filter(({ wine }) => {
        const existingStatus = mintHistory.get(wine.id);
        return !existingStatus || existingStatus.status !== "success";
      });

      addConsoleLog(
        "info",
        `🚀 Main Network: Processing ${winesToProcess.length} wines sequentially with confirmation`
      );

      for (let i = 0; i < winesToProcess.length; i++) {
        // Check stop flag at the beginning of each iteration
        if (wasStopped) {
          addConsoleLog("warning", "🛑 Main network minting stopped by user");
          break;
        }

        const wineData = winesToProcess[i];
        if (!wineData) continue;

        const { winery, wine, index: _index } = wineData;
        const globalWineIndex = startIndex + i;

        addConsoleLog(
          "step",
          `🚀 Processing wine ${globalWineIndex + 1}/${
            winesToProcess.length
          }: ${wine.generalInfo?.collectionName || wine.id}`
        );
        addConsoleLog("info", `🏭 Winery: ${winery.info?.name || winery.id}`);
        addConsoleLog(
          "info",
          `🍷 Wine: ${wine.generalInfo?.collectionName || wine.id}`
        );
        addConsoleLog(
          "info",
          `📍 Progress: ${globalWineIndex + 1} of ${
            winesToProcess.length
          } wines`
        );

        try {
          // Check stop flag before starting wine processing (this catches stops that happened during previous wine's confirmation)
          if (stoppedRef.current) {
            addConsoleLog(
              "warning",
              `🛑 Stopping before processing wine ${globalWineIndex + 1}`
            );
            break;
          }

          // Update status to minting
          const mintingStatus: MintingStatus = {
            wineId: wine.id,
            wineryId: winery.id,
            status: "minting",
            timestamp: new Date(),
            error: undefined,
            txId: undefined,
            tokenRefId: undefined,
          };

          addToMintHistory(wine.id, mintingStatus);

          // Process the wine (same as single minting flow)
          addConsoleLog("info", `🔄 Starting wine processing flow...`);
          const result = await processSingleWineForMainNetwork(winery, wine);

          if (result.success) {
            addConsoleLog(
              "success",
              `✅ Wine ${globalWineIndex + 1} minted successfully!`
            );
            addConsoleLog("info", `🔗 Transaction ID: ${result.txId}`);
            addConsoleLog(
              "info",
              `🏷️ Token Reference ID: ${result.tokenRefId}`
            );

            // Update status to confirming (waiting for blockchain confirmation)
            const confirmingStatus: MintingStatus = {
              wineId: wine.id,
              wineryId: winery.id,
              status: "confirming",
              timestamp: new Date(),
              txId: result.txId,
              tokenRefId: result.tokenRefId,
            };

            addToMintHistory(wine.id, confirmingStatus);
            addConsoleLog(
              "success",
              `✅ Wine ${globalWineIndex + 1} minted successfully! TX: ${
                result.txId
              }`
            );

            // Check stop flag before starting confirmation
            if (stoppedRef.current) {
              addConsoleLog(
                "warning",
                `🛑 Stopping before confirming wine ${globalWineIndex + 1}`
              );
              break;
            }

            // Wait for Blockfrost confirmation before proceeding to next wine
            addConsoleLog(
              "info",
              `⏳ Waiting for Blockfrost confirmation before proceeding to next wine...`
            );

            // Start monitoring transaction status
            addConsoleLog(
              "step",
              `🔍 Starting blockchain confirmation monitoring for wine ${
                globalWineIndex + 1
              }...`
            );

            try {
              await waitForBlockfrostConfirmation(result.txId);
              addConsoleLog(
                "success",
                `✅ Transaction confirmed on blockchain! Proceeding to next wine...`
              );

              // Update status to success after confirmation
              const successStatus: MintingStatus = {
                wineId: wine.id,
                wineryId: winery.id,
                status: "success",
                timestamp: new Date(),
                txId: result.txId,
                tokenRefId: result.tokenRefId,
              };

              addToMintHistory(wine.id, successStatus);
              addConsoleLog(
                "success",
                `🏆 Wine ${globalWineIndex + 1} fully confirmed on blockchain!`
              );

              // Check stop flag after confirmation completes - if stopped, don't continue to next wine
              if (stoppedRef.current) {
                addConsoleLog(
                  "warning",
                  `🛑 Stopping after confirming wine ${
                    globalWineIndex + 1
                  } - not proceeding to next wine`
                );
                break;
              }
            } catch (confirmationError) {
              const errorMsg =
                confirmationError instanceof Error
                  ? confirmationError.message
                  : "Unknown confirmation error";
              addConsoleLog(
                "error",
                `❌ Blockfrost confirmation failed: ${errorMsg}`
              );

              // Update status to failed due to confirmation failure
              const failedStatus: MintingStatus = {
                wineId: wine.id,
                wineryId: winery.id,
                status: "failed",
                timestamp: new Date(),
                error: `Confirmation failed: ${errorMsg}`,
                txId: result.txId,
                tokenRefId: result.tokenRefId,
              };

              addToMintHistory(wine.id, failedStatus);

              // Check stop flag after confirmation error - if stopped, don't continue to next wine
              if (stoppedRef.current) {
                addConsoleLog(
                  "warning",
                  `🛑 Stopping after confirmation error for wine ${
                    globalWineIndex + 1
                  } - not proceeding to next wine`
                );
                break;
              }

              throw confirmationError; // Re-throw to stop processing
            }
          } else {
            addConsoleLog(
              "error",
              `❌ Wine ${globalWineIndex + 1} processing failed`
            );
            addConsoleLog(
              "error",
              `💥 Error: ${result.error || "Unknown error"}`
            );

            // Update status to failed
            const failedStatus: MintingStatus = {
              wineId: wine.id,
              wineryId: winery.id,
              status: "failed",
              timestamp: new Date(),
              error: result.error || "Unknown error",
              txId: undefined,
              tokenRefId: undefined,
            };

            addToMintHistory(wine.id, failedStatus);
            addConsoleLog(
              "error",
              `❌ Wine ${globalWineIndex + 1} failed: ${result.error}`
            );
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          addConsoleLog(
            "error",
            `❌ Wine ${globalWineIndex + 1} processing error: ${errorMsg}`
          );
          addConsoleLog("error", `💥 Exception details: ${errorMsg}`);

          // Update status to failed
          const failedStatus: MintingStatus = {
            wineId: wine.id,
            wineryId: winery.id,
            status: "failed",
            timestamp: new Date(),
            error: errorMsg,
            txId: undefined,
            tokenRefId: undefined,
          };

          addToMintHistory(wine.id, failedStatus);

          // Check stop flag after processing error - if stopped, don't continue to next wine
          if (stoppedRef.current) {
            addConsoleLog(
              "warning",
              `🛑 Stopping after processing error for wine ${
                globalWineIndex + 1
              } - not proceeding to next wine`
            );
            break;
          }
        }
      }

      if (wasStopped) {
        addConsoleLog("warning", "🛑 Main network minting stopped by user");
        addConsoleLog(
          "info",
          "📚 Mint history preserved - you can resume from where you left off"
        );
      } else {
        addConsoleLog(
          "success",
          "✅ Main network minting completed successfully!"
        );
        addConsoleLog(
          "info",
          "🎉 All wines processed with blockchain confirmation"
        );
      }

      setIsProcessing(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      addConsoleLog("error", `❌ Main network minting error: ${errorMsg}`);
      setIsProcessing(false);
    }
  };

  // Process a single wine for main network minting (reuses single minting logic)
  const processSingleWineForMainNetwork = async (
    winery: Winery,
    wine: Wine
  ) => {
    try {
      // Check if we should stop before processing
      if (wasStopped) {
        return {
          success: false,
          error: "Processing stopped by user",
        };
      }

      // Validate wine has valid image
      if (
        !wine.generalInfo?.image ||
        !wine.generalInfo.image.startsWith("https://")
      ) {
        return {
          success: false,
          error: "Wine does not have valid image URL",
        };
      }

      // Download image from Firebase Storage
      const imageFile = await downloadImageAsFile(
        wine.generalInfo.image,
        `${wine.id}.jpg`
      );

      // Upload to IPFS
      const ipfsUrl = await uploadImageToIPFS(imageFile);

      // Create minting payload
      const payload = await createMintPayload(wine, ipfsUrl);

      // Mint the token using the existing mintToken function
      const mintResult = await mintToken(payload);

      // The mintToken function already handles the response structure
      // We just need to return the success/failure status
      return {
        success: true,
        txId: mintResult.txId,
        tokenRefId: mintResult.tokenRefId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      addConsoleLog(
        "error",
        `❌ Main network wine processing failed: ${errorMsg}`
      );
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // Wait for Blockfrost confirmation before proceeding to next wine
  const waitForBlockfrostConfirmation = async (txId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let checkCount = 0;
      const maxChecks = 60; // 10 minutes max (60 * 10 seconds)

      const checkStatus = async () => {
        // Check if we should stop monitoring
        if (stoppedRef.current) {
          const errorMsg = "Transaction monitoring stopped by user";
          addConsoleLog("warning", `🛑 ${errorMsg}`);
          reject(new Error(errorMsg));
          return;
        }

        if (checkCount >= maxChecks) {
          const errorMsg = "Transaction confirmation timeout after 10 minutes";
          addConsoleLog("error", `❌ ${errorMsg}`);
          reject(new Error(errorMsg));
          return;
        }

        try {
          checkCount++;
          addConsoleLog(
            "info",
            `🔍 Blockfrost check #${checkCount} for txId: ${txId}`
          );

          const response = await abortableFetch(
            `/api/blockfrost/transaction-status?txId=${txId}`
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Status check failed: ${response.status} ${response.statusText} - ${errorText}`
            );
          }

          const statusData = await response.json();

          if (statusData.error) {
            throw new Error(statusData.error);
          }

          addConsoleLog(
            "info",
            `📊 Blockfrost response: ${JSON.stringify(statusData)}`
          );

          if (statusData.status === "complete") {
            addConsoleLog(
              "success",
              `✅ Transaction confirmed on blockchain! Block height: ${statusData.blockHeight}`
            );
            resolve();
            return;
          }

          if (statusData.status === "error") {
            const errorMsg = `Transaction failed: ${statusData.details}`;
            addConsoleLog("error", `❌ ${errorMsg}`);
            reject(new Error(errorMsg));
            return;
          }

          // Still pending, check again in 10 seconds
          addConsoleLog(
            "info",
            `⏳ Transaction still pending: ${statusData.details}. Checking again in 10 seconds...`
          );
          setTimeout(() => {
            if (!stoppedRef.current) {
              checkStatus();
            }
          }, 10000);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          addConsoleLog("error", `❌ Status check failed: ${errorMsg}`);

          // Retry in 10 seconds on error
          setTimeout(() => {
            if (!stoppedRef.current) {
              checkStatus();
            }
          }, 10000);
        }
      };

      // Start the first check
      checkStatus();
    });
  };

  // Handle winery selection for single minting
  const handleWineryChange = (wineryId: string) => {
    setSelectedWinery(wineryId);
    setSelectedWine("");
    setMintPayload(null); // Clear previous payload
    setMintResult(null);
    stopMonitoring("Winery selection changed", false); // Stop any ongoing monitoring
    clearConsole(); // Clear console logs

    if (wineryId) {
      const winery = wineries.find((w) => w.id === wineryId);
      if (winery && winery.wines) {
        setAvailableWines(winery.wines);
      } else {
        setAvailableWines([]);
      }
    } else {
      setAvailableWines([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✓";
      case "failed":
        return "✕";
      case "minting":
        return "⟳";
      case "confirming":
        return "⏳";
      case "pending":
        return "○";
      default:
        return "○";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "failed":
        return "failed";
      case "minting":
        return "minting";
      case "confirming":
        return "confirming";
      case "pending":
        return "pending";
      default:
        return "pending";
    }
  };

  // Mint history management functions
  const addToMintHistory = (assetId: string, status: MintingStatus) => {
    setMintHistory((prev) => new Map(prev).set(assetId, status));

    // Update mintedAssets set based on current status
    setMintedAssets((prev) => {
      const newSet = new Set(prev);
      if (status.status === "success") {
        newSet.add(assetId);
      } else {
        // Remove from minted assets if status changed from success to something else
        newSet.delete(assetId);
      }
      return newSet;
    });
  };

  // TODO: These functions are defined but not currently used - uncomment when needed
  // const isAssetAlreadyMinted = (assetId: string): boolean => {
  //   const existingStatus = mintHistory.get(assetId);
  //   // Only consider it "already minted" if it was successfully completed
  //   return existingStatus?.status === "success";
  // };

  // const getMintHistoryForWinery = (wineryId: string): MintingStatus[] => {
  //   return Array.from(mintHistory.values()).filter(
  //     (item) => item.wineryId === wineryId
  //   );
  // };

  // const getMintHistoryForWine = (wineId: string): MintingStatus | undefined => {
  //   return mintHistory.get(wineId);
  // };

  const clearMintHistory = () => {
    setMintHistory(new Map());
    setMintedAssets(new Set());
    setResumeFromIndex(0);
  };

  const getResumeData = () => {
    const completedAssets = Array.from(mintHistory.values()).filter(
      (item) => item.status === "success"
    );
    const failedAssets = Array.from(mintHistory.values()).filter(
      (item) => item.status === "failed"
    );
    const pendingAssets = Array.from(mintHistory.values()).filter(
      (item) => item.status === "pending" || item.status === "minting"
    );
    const confirmingAssets = Array.from(mintHistory.values()).filter(
      (item) => item.status === "confirming"
    );

    return {
      completed: completedAssets.length,
      failed: failedAssets.length,
      pending: pendingAssets.length,
      confirming: confirmingAssets.length,
      total: mintHistory.size,
      canResume:
        failedAssets.length > 0 ||
        pendingAssets.length > 0 ||
        confirmingAssets.length > 0 ||
        completedAssets.length < mintHistory.size,
    };
  };

  const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Handle copying transaction ID to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if you want
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // TODO: These functions are defined but not currently used - uncomment when needed
  // // Handle opening transaction in Cardano explorer
  // const openInExplorer = (txId: string) => {
  //   const explorerUrl = `https://preview.cardanoscan.io/transaction/${txId}`;
  //   window.open(explorerUrl, "_blank");
  // };

  // // Handle opening token in cexplorer.io
  // const openTokenInExplorer = (tokenRefId: string) => {
  //   const explorerUrl = `https://preview.cexplorer.io/asset/${tokenRefId}`;
  //   window.open(explorerUrl, "_blank");
  // };

  // Build mint results JSON (only successful mints)
  const buildMintResults = () => {
    const results = Array.from(mintHistory.values())
      .filter((item) => item.status === "success")
      .map((item) => {
        const winery = wineries.find((w) => w.id === item.wineryId);
        const wine = winery?.wines?.find((w) => w.id === item.wineId);
        return {
          wineryId: item.wineryId,
          wineryName: winery?.info?.name || null,
          wineId: item.wineId,
          wineName: wine?.generalInfo?.collectionName || null,
          txId: item.txId || null,
          tokenRefId: item.tokenRefId || null,
          status: item.status,
          timestamp:
            item.timestamp instanceof Date
              ? item.timestamp.toISOString()
              : new Date(item.timestamp as string | number).toISOString(),
          network: environmentMode,
        };
      });
    return results;
  };

  // Download mint results as JSON file
  const downloadMintResults = () => {
    try {
      const data = buildMintResults();
      const pretty = JSON.stringify(data, null, 2);
      const blob = new Blob([pretty], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `mint-results-${environmentMode}-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addConsoleLog("success", "📥 Mint results JSON downloaded");
    } catch (err) {
      addConsoleLog(
        "error",
        `❌ Failed to generate results JSON: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  // Download image from Firebase Storage via our API proxy and convert to File object
  const downloadImageAsFile = async (
    imageUrl: string,
    fileName: string
  ): Promise<File> => {
    try {
      // Check if we should stop before starting download
      if (wasStopped) {
        throw new Error("Image download stopped by user");
      }

      setImageProcessingStep("Downloading image from Firebase Storage...");
      addConsoleLog(
        "step",
        `📥 Starting image download from Firebase Storage via API proxy...`
      );
      addConsoleLog("info", `🔗 Source URL: ${imageUrl}`);

      // Use our API proxy to avoid CORS issues
      const response = await abortableFetch(
        "/api/tokenization/download-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = `Failed to download image: ${
          errorData.error || response.statusText
        }`;
        addConsoleLog("error", `❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      addConsoleLog("success", `✅ Image downloaded successfully!`);
      addConsoleLog(
        "info",
        `📁 File: ${fileName} (${blob.size} bytes, ${blob.type})`
      );
      setImageProcessingStep("Image downloaded successfully");
      return file;
    } catch (error) {
      console.error("Error downloading image:", error);
      const errorMsg = `Failed to download image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      addConsoleLog("error", `❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  };

  // Upload image to IPFS via our server-side API route
  const uploadImageToIPFS = async (imageFile: File): Promise<string> => {
    try {
      // Check if we should stop before starting upload
      if (wasStopped) {
        throw new Error("IPFS upload stopped by user");
      }

      setImageProcessingStep("Uploading image to IPFS...");
      addConsoleLog(
        "step",
        `🚀 Starting IPFS upload via server-side API route...`
      );
      addConsoleLog(
        "info",
        `📤 File: ${imageFile.name} (${imageFile.size} bytes)`
      );

      addConsoleLog(
        "info",
        `🔧 Using server-side API route with proper authorization...`
      );

      // Use our server-side API route to avoid client-side environment variable issues
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await abortableFetch("/api/tokenization/add-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = `IPFS upload failed: ${
          errorData.error || response.statusText
        }`;
        addConsoleLog("error", `❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Get the raw text response (ipfs://<hash>) and clean it
      let ipfsUrl = await response.text();

      // Clean the response - remove any extra quotes or whitespace
      ipfsUrl = ipfsUrl.trim().replace(/^["']|["']$/g, "");

      addConsoleLog("info", `🧹 Cleaned IPFS URL: ${ipfsUrl}`);

      addConsoleLog("info", `📡 IPFS API Response: ${ipfsUrl}`);

      if (!ipfsUrl || !ipfsUrl.startsWith("ipfs://")) {
        const errorMsg = "Invalid IPFS response format";
        addConsoleLog("error", `❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Extract IPFS hash (remove "ipfs://" prefix)
      const ipfsHash = ipfsUrl.replace("ipfs://", "");
      addConsoleLog("info", `🔍 Extracted IPFS Hash: ${ipfsHash}`);

      // Generate public IPFS gateway URL for reference
      const publicIPFSUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      addConsoleLog("success", `✅ Image uploaded to IPFS successfully!`);
      addConsoleLog("info", `🌐 Public IPFS Gateway: ${publicIPFSUrl}`);
      addConsoleLog("info", `🔗 Original IPFS URL: ${ipfsUrl}`);

      setImageProcessingStep("Image uploaded to IPFS successfully");
      return ipfsUrl; // Return the original ipfs://<hash> URL
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      const errorMsg = `IPFS upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      addConsoleLog("error", `❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  };

  // Create mint payload object
  const createMintPayload = async (
    wine: Wine,
    ipfsImageUrl: string
  ): Promise<MintPayload> => {
    addConsoleLog("step", `🔨 Creating mint payload...`);
    addConsoleLog("info", `🍷 Wine: ${wine.generalInfo.collectionName}`);
    addConsoleLog("info", `🏭 Winery: ${wine.generalInfo.wineryName}`);
    addConsoleLog("info", `🖼️ IPFS Image: ${ipfsImageUrl}`);

    // Fetch IoT storage data for the mdata field
    addConsoleLog("step", `📡 Fetching IoT sensor data from external API...`);
    let iotData = {};

    try {
      const { getIotStorageData } = await import("@/services/iot-storage");
      const iotResponse = await getIotStorageData();

      if (iotResponse && iotResponse.status === "success" && iotResponse.data) {
        iotData = iotResponse.data;
        addConsoleLog("success", `✅ IoT sensor data fetched successfully`);
        addConsoleLog(
          "info",
          `📊 IoT data size: ${JSON.stringify(iotData).length} characters`
        );
      } else {
        addConsoleLog(
          "warning",
          `⚠️ IoT sensor data unavailable, using empty object`
        );
        iotData = {};
      }
    } catch (error) {
      addConsoleLog(
        "warning",
        `⚠️ Failed to fetch IoT sensor data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      addConsoleLog("info", `📊 Using empty object for mdata field`);
      iotData = {};
    }

    const payload = {
      batch_data: {
        info: JSON.stringify(wine),
        mdata: JSON.stringify(iotData), // Now contains actual IoT sensor data
        minsrc: "",
      },
      batch_meta: {
        description:
          "This token binds a unique wine collection from tracecork.com on the cardano blockchain.",
        image: ipfsImageUrl, // This now contains ipfs://<hash> instead of gateway URL
        name: wine.generalInfo.collectionName,
      },
      batch_quantity: [1, 1],
    };

    addConsoleLog("success", `✅ Mint payload created successfully!`);
    addConsoleLog(
      "info",
      `📊 Payload structure: batch_data, batch_meta, batch_quantity`
    );
    addConsoleLog(
      "info",
      `🔗 Image URL in payload: ${ipfsImageUrl} (original IPFS URL)`
    );
    addConsoleLog(
      "info",
      `📡 IoT data in payload: ${JSON.stringify(iotData).length} characters`
    );

    return payload;
  };

  // Stop transaction monitoring
  const stopMonitoring = (reason?: string, keepStatus: boolean = false) => {
    addConsoleLog(
      "warning",
      `🛑 Stopping transaction monitoring... ${
        reason ? `Reason: ${reason}` : ""
      }`
    );
    if (monitoringCleanup) {
      monitoringCleanup();
      setMonitoringCleanup(null);
    }
    setMonitoringWithLog(false);

    // Only reset status if we're not keeping it (e.g., for successful completion)
    if (!keepStatus) {
      setTransactionStatus(null);
      setStatusDetails("");
    }
    setStatusCheckCount(0);
  };

  // Monitor transaction status using Blockfrost API
  const monitorTransactionStatus = async (txId: string) => {
    // Prevent multiple monitoring sessions
    if (isMonitoring) {
      addConsoleLog(
        "warning",
        `⚠️ Monitoring already in progress, stopping previous session`
      );
      stopMonitoring("New monitoring session started", false);
    }

    addConsoleLog("step", `🔍 Starting transaction status monitoring...`);
    addConsoleLog("info", `🔑 Monitoring session ID: ${Date.now()}`);
    setMonitoringWithLog(true);
    setTransactionStatus("pending");
    setStatusDetails("Confirming on chain...");
    setStatusCheckCount(0);

    let isActive = true; // Local flag to control the monitoring loop
    const sessionId = Date.now(); // Unique session identifier

    const checkStatus = async (): Promise<void> => {
      if (!isActive) return; // Stop if monitoring was cancelled

      try {
        const currentCheck = statusCheckCount + 1;
        setStatusCheckCount(currentCheck);
        addConsoleLog(
          "info",
          `🔍 Status check #${currentCheck} for txId: ${txId} (Session: ${sessionId})`
        );

        const response = await abortableFetch(
          `/api/blockfrost/transaction-status?txId=${txId}`
        );

        if (!response.ok) {
          throw new Error(
            `Status check failed: ${response.status} ${response.statusText}`
          );
        }

        const statusData = await response.json();

        if (statusData.error) {
          throw new Error(statusData.error);
        }

        addConsoleLog(
          "info",
          `🔄 Setting transaction status: ${statusData.status}`
        );
        addConsoleLog("info", `📝 Status details: ${statusData.details}`);
        setTransactionStatus(statusData.status);
        setStatusDetails(statusData.details);

        if (statusData.status === "complete") {
          addConsoleLog("success", `✅ Transaction confirmed on blockchain!`);
          addConsoleLog("info", `📊 Block height: ${statusData.blockHeight}`);
          stopMonitoring("Transaction completed successfully", true); // Keep the status
          showToast("success", "Transaction confirmed on blockchain!");
          return;
        }

        if (statusData.status === "error") {
          addConsoleLog(
            "error",
            `❌ Transaction failed: ${statusData.details}`
          );
          stopMonitoring("Transaction failed", false);
          showToast("error", `Transaction failed: ${statusData.details}`);
          return;
        }

        // Still pending, continue monitoring
        addConsoleLog(
          "info",
          `⏳ Transaction still pending: ${statusData.details}`
        );

        // Schedule next check in 10 seconds
        addConsoleLog(
          "info",
          `⏰ Scheduling next status check in 10 seconds...`
        );
        setTimeout(() => {
          addConsoleLog(
            "info",
            `⏰ Timer callback executed - checking conditions...`
          );
          addConsoleLog(
            "info",
            `⏰ isActive: ${isActive}, isMonitoring: ${isMonitoring}`
          );
          addConsoleLog("info", `⏰ Session ID: ${sessionId}`);
          addConsoleLog(
            "info",
            `⏰ monitoringRef.current: ${monitoringRef.current}`
          );

          if (isActive && monitoringRef.current) {
            addConsoleLog("info", `⏰ Executing scheduled status check...`);
            checkStatus();
          } else {
            addConsoleLog(
              "warning",
              `⏰ Status check cancelled - monitoring stopped`
            );
            if (!isActive)
              addConsoleLog("warning", `⏰ Reason: isActive = false`);
            if (!monitoringRef.current)
              addConsoleLog(
                "warning",
                `⏰ Reason: monitoringRef.current = false`
              );
          }
        }, 10000);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        addConsoleLog("error", `❌ Status check failed: ${errorMsg}`);

        // Retry in 10 seconds on error
        addConsoleLog("warning", `⏰ Scheduling error retry in 10 seconds...`);
        setTimeout(() => {
          addConsoleLog(
            "info",
            `⏰ Error retry timer callback executed - checking conditions...`
          );
          addConsoleLog(
            "info",
            `⏰ isActive: ${isActive}, isMonitoring: ${isMonitoring}`
          );
          addConsoleLog("info", `⏰ Session ID: ${sessionId}`);
          addConsoleLog(
            "info",
            `⏰ monitoringRef.current: ${monitoringRef.current}`
          );

          if (isActive && monitoringRef.current) {
            addConsoleLog("info", `⏰ Executing error retry...`);
            checkStatus();
          } else {
            addConsoleLog(
              "warning",
              `⏰ Error retry cancelled - monitoring stopped`
            );
            if (!isActive)
              addConsoleLog("warning", `⏰ Reason: isActive = false`);
            if (!monitoringRef.current)
              addConsoleLog(
                "warning",
                `⏰ Reason: monitoringRef.current = false`
              );
          }
        }, 10000);
      }
    };

    // Start the monitoring
    checkStatus();

    // Add a heartbeat to verify monitoring is active
    const heartbeat = setInterval(() => {
      if (isActive && monitoringRef.current) {
        addConsoleLog("info", `💓 Monitoring heartbeat - still active`);
      } else {
        clearInterval(heartbeat);
      }
    }, 5000); // Every 5 seconds

    // Store the cleanup function
    const cleanup = () => {
      addConsoleLog("warning", `🧹 Cleanup function called`);
      isActive = false;
      setMonitoringWithLog(false);
      clearInterval(heartbeat);
    };
    setMonitoringCleanup(() => cleanup);

    // Return a cleanup function
    return cleanup;
  };

  // Mint token using the mint-batch API
  const mintToken = async (payload: MintPayload) => {
    addConsoleLog("step", `🚀 Step 5: Minting token via mint-batch API...`);

    try {
      // Check if we should stop before minting
      if (wasStopped) {
        throw new Error("Token minting stopped by user");
      }

      setIsMinting(true);

      const response = await abortableFetch("/api/tokenization/mint-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: errorText || "Failed to parse error response" };
        }

        const errorMsg = `Minting failed: ${response.status} ${
          response.statusText
        } - ${errorData.error || "Unknown error"}`;
        addConsoleLog("error", `❌ ${errorMsg}`);
        addConsoleLog("error", `📊 Response status: ${response.status}`);
        addConsoleLog(
          "error",
          `📊 Response headers: ${JSON.stringify(
            Object.fromEntries(response.headers.entries())
          )}`
        );

        throw new Error(errorMsg);
      }

      const result = await response.json();

      if (!result.txId || !result.tokenRefId) {
        throw new Error("Invalid minting response: missing txId or tokenRefId");
      }

      addConsoleLog("success", `✅ Transaction submitted successfully!`);
      addConsoleLog("info", `🔗 Transaction ID: ${result.txId}`);
      addConsoleLog("info", `🏷️ Token Reference ID: ${result.tokenRefId}`);

      setMintResult(result);
      showToast("success", "Transaction submitted successfully!");

      // Start monitoring transaction status
      addConsoleLog(
        "step",
        `🔍 Starting blockchain confirmation monitoring...`
      );
      addConsoleLog(
        "info",
        `🔍 About to call monitorTransactionStatus with txId: ${result.txId}`
      );
      await monitorTransactionStatus(result.txId);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      addConsoleLog("error", `❌ Minting failed: ${errorMsg}`);
      showToast("error", `Minting failed: ${errorMsg}`);
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  // Complete single minting flow
  const handleSingleMintComplete = async () => {
    if (!selectedWinery || !selectedWine) {
      showToast("error", "Please select both a winery and a wine");
      return;
    }

    try {
      setIsProcessingImage(true);
      setImageProcessingStep("Starting single minting process...");

      // Clear previous console logs and add initial log
      clearConsole();
      stopMonitoring("Starting new process", false); // Stop any ongoing monitoring
      addConsoleLog("step", `🚀 Starting Single Wine Processing Flow...`);
      addConsoleLog(
        "info",
        `🌍 Environment: ${
          environmentMode === "test" ? "Test Mode" : "Main Network"
        }`
      );

      const winery = wineries.find((w) => w.id === selectedWinery);
      const wine = availableWines.find((w) => w.id === selectedWine);

      if (!winery || !wine) {
        const errorMsg = "Selected winery or wine not found";
        addConsoleLog("error", `❌ ${errorMsg}`);
        setError(errorMsg);
        return;
      }

      addConsoleLog("info", `🏭 Selected Winery: ${winery.info.name}`);
      addConsoleLog(
        "info",
        `🍷 Selected Wine: ${wine.generalInfo.collectionName}`
      );

      // Step 1: Validate wine has a valid image
      addConsoleLog("step", `🔍 Step 1: Validating wine image...`);
      addConsoleLog(
        "info",
        `🖼️ Wine image property: ${wine.generalInfo.image || "undefined"}`
      );

      if (!wine.generalInfo.image) {
        const errorMsg = "Wine does not have an image property in generalInfo";
        addConsoleLog("error", `❌ ${errorMsg}`);
        showToast("error", errorMsg);
        setIsProcessingImage(false);
        return;
      }

      if (!wine.generalInfo.image.startsWith("https://")) {
        const errorMsg = `Wine image is not a valid Firebase Storage URL. Found: ${wine.generalInfo.image}`;
        addConsoleLog("error", `❌ ${errorMsg}`);
        addConsoleLog(
          "info",
          `💡 This wine has a relative path or invalid URL. Only wines with Firebase Storage URLs can be processed.`
        );
        showToast("error", errorMsg);
        setIsProcessingImage(false);
        return;
      }

      addConsoleLog("success", `✅ Wine image validation passed!`);
      addConsoleLog(
        "info",
        `🔗 Firebase Storage URL: ${wine.generalInfo.image}`
      );

      // Step 2: Download image from Firebase Storage
      addConsoleLog(
        "step",
        `📥 Step 2: Downloading image from Firebase Storage...`
      );
      const imageFile = await downloadImageAsFile(
        wine.generalInfo.image,
        `${wine.id}.jpg`
      );

      // Step 3: Upload image to IPFS
      addConsoleLog("step", `🚀 Step 3: Uploading image to IPFS...`);
      const ipfsImageUrl = await uploadImageToIPFS(imageFile);

      // Step 4: Create mint payload
      addConsoleLog("step", `🔨 Step 4: Creating mint payload...`);
      const payload = await createMintPayload(wine, ipfsImageUrl);

      // Step 5: Store payload and log it
      setMintPayload(payload);
      console.log("Mint payload created:", payload);

      // Step 6: Mint the token
      addConsoleLog("step", `🚀 Step 5: Minting token...`);
      const mintResult = await mintToken(payload);

      addConsoleLog("success", `🎉 Single Wine Processing & Minting Complete!`);
      addConsoleLog(
        "info",
        `📋 Transaction submitted successfully with txId: ${mintResult.txId}`
      );
      addConsoleLog("info", `🏷️ Token Reference ID: ${mintResult.tokenRefId}`);

      showToast("success", "Transaction submitted successfully!");

      setImageProcessingStep(
        "Transaction submitted successfully! Check results below."
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred";
      addConsoleLog("error", `💥 Process failed: ${errorMsg}`);
      showToast("error", errorMsg);
      console.error("Single minting error:", error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-right duration-300 ease-out`}
        >
          <div
            className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-900/90 border-green-500/50 text-green-100"
                : "bg-red-900/90 border-red-500/50 text-red-100"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {toast.type === "success" ? "✅" : "❌"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={hideToast}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="terminal p-6 w-full">
        <div
          className={`flex items-center justify-between ${
            isCollapsed ? "mb-0" : "mb-4"
          }`}
        >
          <h2 className="text-lg font-medium text-[var(--retro-text-muted)]">
            Minting Test
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[var(--retro-text-muted)] hover:text-[var(--retro-text)] transition-colors"
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Environment Toggle */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm text-[var(--retro-text-muted)]">
                  Environment:
                </span>
                <div className="flex bg-[var(--retro-surface)] rounded-lg p-1 border border-[var(--retro-border)]">
                  <button
                    onClick={() => setEnvironmentMode("test")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      environmentMode === "test"
                        ? "bg-[var(--retro-accent)] text-[var(--retro-bg)]"
                        : "text-[var(--retro-text-muted)] hover:text-[var(--retro-text)]"
                    }`}
                  >
                    Test Mode
                  </button>
                  <button
                    onClick={() => setEnvironmentMode("main")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      environmentMode === "main"
                        ? "bg-[var(--retro-accent)] text-[var(--retro-bg)]"
                        : "text-[var(--retro-text-muted)] hover:text-[var(--retro-text)]"
                    }`}
                  >
                    Main Network
                  </button>
                </div>
              </div>

              <div className="bg-[var(--retro-surface-2)] border border-[var(--retro-border)] rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      environmentMode === "test"
                        ? "bg-[var(--retro-warning)]"
                        : "bg-[var(--retro-accent)]"
                    }`}
                  ></div>
                  <span className="text-sm text-[var(--retro-text-muted)]">
                    {environmentMode === "test"
                      ? "Test Mode: Using mock APIs and test data"
                      : "Main Network: Single wine processing enabled, bulk minting disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Minting Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm text-[var(--retro-text-muted)]">
                  Minting Mode:
                </span>
                <div className="flex bg-[var(--retro-surface)] rounded-lg p-1 border border-[var(--retro-border)]">
                  <button
                    onClick={() => setMintingMode("bulk")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      mintingMode === "bulk"
                        ? "bg-[var(--retro-accent)] text-[var(--retro-bg)]"
                        : "text-[var(--retro-text-muted)] hover:text-[var(--retro-text)]"
                    }`}
                  >
                    Bulk Mint
                  </button>
                  <button
                    onClick={() => setMintingMode("single")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      mintingMode === "single"
                        ? "bg-[var(--retro-accent)] text-[var(--retro-bg)]"
                        : "text-[var(--retro-text-muted)] hover:text-[var(--retro-text)]"
                    }`}
                  >
                    Single Wine
                  </button>
                </div>
              </div>

              {mintingMode === "bulk" ? (
                <p className="text-[var(--retro-text-muted)] mb-4 text-sm">
                  {environmentMode === "main"
                    ? "🚀 Main Network Mode: Real blockchain minting with transaction confirmation. Each mint waits for Blockfrost confirmation before proceeding to the next."
                    : "🧪 Test Mode: Demonstrates the batch minting processor with mock API calls. It will process wineries and their wines sequentially, simulating real blockchain minting."}
                </p>
              ) : (
                <div className="mb-4 space-y-2">
                  <p className="text-[var(--retro-text-muted)] text-sm">
                    Select a specific winery and wine to process individually.
                    Works in both test and main network modes.
                  </p>
                  <div className="bg-[var(--retro-surface-2)] border border-[var(--retro-border)] rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-[var(--retro-warning)] rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-xs text-[var(--retro-text-muted)]">
                        <strong>Note:</strong> Only wines with Firebase Storage
                        URLs (starting with &quot;https://&quot;) can be
                        processed. Wines with relative paths like
                        &quot;/images/wine.jpg&quot; will show an error.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {mintingMode === "bulk" ? (
              <div className="flex gap-4 mb-6">
                <button
                  onClick={
                    environmentMode === "test" || environmentMode === "main"
                      ? handleStartMinting
                      : undefined
                  }
                  disabled={isProcessing}
                  className="btn-retro px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(() => {
                    if (isProcessing) {
                      return "Minting...";
                    }

                    if (
                      environmentMode === "test" ||
                      environmentMode === "main"
                    ) {
                      if (mintHistory.size > 0) {
                        const resumeData = getResumeData();
                        // Debug logging for button state
                        console.log("Button state:", {
                          mintHistorySize: mintHistory.size,
                          completed: resumeData.completed,
                          failed: resumeData.failed,
                          pending: resumeData.pending,
                          total: resumeData.total,
                          canResume: resumeData.canResume,
                        });
                        return `🔄 Resume Minting (${resumeData.completed}/${resumeData.total})`;
                      }
                      return environmentMode === "main"
                        ? "🚀 Start Main Network Minting"
                        : "Start Auto Minting";
                    }

                    return "Main network - Coming soon";
                  })()}
                </button>

                {isProcessing &&
                  (environmentMode === "test" ||
                    environmentMode === "main") && (
                    <button
                      onClick={handleStopMinting}
                      className="btn-retro px-6 py-3 border-[var(--retro-error)] text-[var(--retro-error)] hover:bg-[var(--retro-error)] hover:text-[var(--retro-bg)]"
                    >
                      Stop minting
                    </button>
                  )}

                {/* Download results button: show when stopped, or when all done */}
                {mintingMode === "bulk" &&
                  !isProcessing &&
                  mintHistory.size > 0 && (
                    <button
                      onClick={downloadMintResults}
                      className="btn-retro px-6 py-3"
                      title="Download successful mint results as JSON"
                    >
                      ⬇️ Download results JSON
                    </button>
                  )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Winery Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--retro-text)] mb-2">
                      Select Winery
                    </label>
                    <div className="relative">
                      <select
                        value={selectedWinery}
                        onChange={(e) => handleWineryChange(e.target.value)}
                        className="w-full bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg pl-3 pr-10 py-2 text-[var(--retro-text)] focus:outline-none focus:ring-2 focus:ring-[var(--retro-accent)] appearance-none"
                      >
                        <option value="">Choose a winery...</option>
                        {wineries.map((winery) => (
                          <option key={winery.id} value={winery.id}>
                            {winery.info.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-[var(--retro-text-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--retro-text)] mb-2">
                      Select Wine
                    </label>
                    <div className="relative">
                      <select
                        value={selectedWine}
                        onChange={(e) => {
                          setSelectedWine(e.target.value);
                          setMintPayload(null); // Clear previous payload
                          clearConsole(); // Clear console logs
                        }}
                        disabled={
                          !selectedWinery || availableWines.length === 0
                        }
                        className="w-full bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg pl-3 pr-10 py-2 text-[var(--retro-text)] focus:outline-none focus:ring-2 focus:ring-[var(--retro-accent)] appearance-none"
                      >
                        <option value="">Choose a wine...</option>
                        {availableWines.map((wine) => {
                          const hasValidImage =
                            wine.generalInfo.image &&
                            wine.generalInfo.image.startsWith("https://");
                          return (
                            <option key={wine.id} value={wine.id}>
                              {wine.generalInfo.collectionName}
                              {hasValidImage ? " ✅" : " ❌"}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-[var(--retro-text-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Wine Image Debug Info */}
                    {selectedWine && (
                      <div className="text-xs text-[var(--retro-text-muted)] mt-2 p-2 bg-[var(--retro-bg)] border border-[var(--retro-border)] rounded">
                        {(() => {
                          const wine = availableWines.find(
                            (w) => w.id === selectedWine
                          );
                          if (wine?.generalInfo.image) {
                            if (wine.generalInfo.image.startsWith("https://")) {
                              return (
                                <div>
                                  <div className="font-medium text-[var(--retro-success)] mb-1">
                                    ✅ Valid Firebase Storage URL
                                  </div>
                                  <div className="break-all text-xs">
                                    {wine.generalInfo.image}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div>
                                  <div className="font-medium text-[var(--retro-error)] mb-1">
                                    ❌ Relative path (cannot process)
                                  </div>
                                  <div className="break-all text-xs">
                                    {wine.generalInfo.image}
                                  </div>
                                </div>
                              );
                            }
                          }
                          return (
                            <div className="text-[var(--retro-error)]">
                              ❌ No image available
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Single Mint Button */}
                <div className="flex gap-4">
                  <button
                    onClick={handleSingleMintComplete}
                    disabled={
                      isProcessingImage ||
                      isMinting ||
                      isMonitoring ||
                      !selectedWinery ||
                      !selectedWine
                    }
                    className="btn-retro px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingImage
                      ? "Processing..."
                      : isMinting
                      ? "Minting..."
                      : isMonitoring
                      ? "Confirming..."
                      : transactionStatus === "complete"
                      ? "✅ Transaction Submitted Successfully"
                      : environmentMode === "test"
                      ? "Process Single Wine (Test)"
                      : "Process Single Wine (Main)"}
                  </button>

                  {isProcessing &&
                    environmentMode === "test" &&
                    mintingMode !== "single" && (
                      <button
                        onClick={handleStopMinting}
                        className="btn-retro px-6 py-3 border-[var(--retro-error)] text-[var(--retro-error)] hover:bg-[var(--retro-error)] hover:text-[var(--retro-bg)]"
                      >
                        Stop Bulk Minting
                      </button>
                    )}
                </div>

                {/* Image Processing Steps */}
                {isProcessingImage && (
                  <div className="bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg p-4">
                    <h4 className="font-medium text-[var(--retro-text)] mb-3">
                      Processing Steps
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[var(--retro-accent)] rounded-full animate-pulse"></div>
                        <span className="text-sm text-[var(--retro-text)]">
                          {imageProcessingStep}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mint Payload Display */}
                {mintPayload && (
                  <div className="bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg p-4">
                    <h4 className="font-medium text-[var(--retro-text)] mb-3">
                      Mint Payload Created
                    </h4>
                    <div className="bg-[var(--retro-bg)] border border-[var(--retro-border)] rounded-lg p-3">
                      <pre className="text-xs text-[var(--retro-text)] overflow-x-auto">
                        {JSON.stringify(mintPayload, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-3 text-xs text-[var(--retro-text-muted)]">
                      ✅ Payload created successfully! Check the browser console
                      for detailed output.
                    </div>
                  </div>
                )}

                {/* Single Mint Result Display */}
                {mintPayload && (
                  <div className="bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg p-4">
                    <h4 className="font-medium text-[var(--retro-text)] mb-3">
                      🍷 Single Wine Mint Result
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[var(--retro-bg)] border border-[var(--retro-border)] rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[var(--retro-success)] rounded-full flex items-center justify-center text-[var(--retro-bg)] font-bold">
                            ✓
                          </div>
                          <div>
                            <div className="font-medium text-[var(--retro-text)]">
                              Wine: {mintPayload.batch_meta.name}
                            </div>
                            <div className="text-sm text-[var(--retro-text-muted)]">
                              Status:{" "}
                              {transactionStatus === "complete"
                                ? "✅ Transaction Submitted Successfully"
                                : transactionStatus === "error"
                                ? "❌ Error Minting Token"
                                : transactionStatus === "pending"
                                ? "⏳ Confirming on chain..."
                                : mintResult
                                ? "🚀 Minting in progress..."
                                : "Ready for minting"}
                            </div>
                            {transactionStatus && (
                              <div className="text-xs text-[var(--retro-text-muted)] mt-1">
                                {statusDetails}
                                {isMonitoring &&
                                  transactionStatus === "pending" && (
                                    <button
                                      onClick={() =>
                                        stopMonitoring(
                                          "User clicked stop button",
                                          false
                                        )
                                      }
                                      className="ml-3 text-xs text-[var(--retro-accent)] hover:text-[var(--retro-accent-hover)] underline"
                                    >
                                      Stop Monitoring
                                    </button>
                                  )}
                                {transactionStatus === "complete" &&
                                  mintResult && (
                                    <div className="mt-2">
                                      <div className="max-w-fit mb-2 p-2 bg-[var(--retro-success)]/20 border border-[var(--retro-success)] rounded text-xs text-[var(--retro-success)]">
                                        ✅ Transaction confirmed on blockchain!
                                        Token is now live and viewable on
                                        cexplorer.io.
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={`https://preview.cardanoscan.io/token/${mintResult.tokenRefId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center text-xs text-[var(--retro-accent)] hover:text-[var(--retro-accent-hover)] underline"
                                        >
                                          🔗 View Token on cexplorer.io
                                          <svg
                                            className="w-3 h-3 ml-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                          </svg>
                                        </a>
                                        <p className="text-xs text-[var(--retro-text-muted)]">
                                          It may take up to 10 minutes for the
                                          token to be visible on the blockchain
                                          explorer.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--retro-accent)] mb-1">
                            IPFS Image
                          </div>
                          <div className="text-xs text-[var(--retro-text-muted)] break-all max-w-xs">
                            {mintPayload.batch_meta.image}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-[var(--retro-text-muted)] p-2 bg-[var(--retro-bg)] border border-[var(--retro-border)] rounded">
                        <div className="font-medium mb-1">
                          📋 Payload Summary:
                        </div>
                        <div>
                          • Wine Collection: {mintPayload.batch_meta.name}
                        </div>
                        <div>
                          • Description: {mintPayload.batch_meta.description}
                        </div>
                        <div>• Image: {mintPayload.batch_meta.image}</div>
                        <div>
                          • Quantity: {mintPayload.batch_quantity.join(" x ")}
                        </div>
                        <div>
                          • Wine Data:{" "}
                          {mintPayload.batch_data.info ? "Included" : "Missing"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mint History Display - Only show in bulk mode */}
            {mintHistory.size > 0 && mintingMode === "bulk" && (
              <div className="bg-[var(--retro-surface)] rounded-lg p-4 mb-6 border border-[var(--retro-border)] mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[var(--retro-accent)]">
                    📚 Mint History
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={clearMintHistory}
                      className="text-xs text-[var(--retro-text-muted)] hover:text-[var(--retro-error)] transition-colors px-2 py-1 rounded border border-[var(--retro-border)] hover:border-[var(--retro-error)]"
                    >
                      Clear History
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--retro-text)] mb-1">
                      {
                        Array.from(mintHistory.values()).filter(
                          (item) => item.status === "success"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Successfully Minted
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--retro-text)] mb-1">
                      {
                        Array.from(mintHistory.values()).filter(
                          (item) => item.status === "failed"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Failed
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--retro-text)] mb-1">
                      {
                        Array.from(mintHistory.values()).filter(
                          (item) =>
                            item.status === "pending" ||
                            item.status === "minting"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Pending
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--retro-text)] mb-1">
                      {mintHistory.size}
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Total Assets
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[var(--retro-text-muted)] p-2 bg-[var(--retro-bg)] border border-[var(--retro-border)] rounded mb-3">
                  <div className="font-medium mb-1">
                    💡 Mint History Features:
                  </div>
                  <div>• Prevents duplicate minting of the same asset</div>
                  <div>• Tracks all minting attempts and results</div>
                  <div>
                    • Enables resume functionality from where you left off
                  </div>
                  <div>• History persists even when minting is stopped</div>
                </div>
              </div>
            )}

            {/* Progress Display - Only show in bulk mode */}
            {progress && mintingMode === "bulk" && (
              <div className="bg-[var(--retro-surface)] rounded-lg p-4 mb-6 border border-[var(--retro-border)] mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[var(--retro-accent)]">
                    Progress monitor
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        environmentMode === "test"
                          ? "bg-[var(--retro-warning)]"
                          : "bg-[var(--retro-error)]"
                      }`}
                    ></div>
                    <span className="text-sm text-[var(--retro-text-muted)]">
                      {environmentMode === "test"
                        ? "Test Mode"
                        : "Main Network"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--retro-text)] mb-1">
                      {progress.processedWineries}
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Wineries processed
                    </div>
                    <div className="text-xs text-[var(--retro-text-muted)]">
                      of {progress.totalWineries}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--retro-text)] mb-1">
                      {progress.processedWines}
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Wines processed
                    </div>
                    <div className="text-xs text-[var(--retro-text-muted)]">
                      of {progress.totalWines}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-[var(--retro-text)] mb-1 min-h-[28px] flex items-center justify-center">
                      {progress.currentWinery
                        ? truncateText(progress.currentWinery, 15)
                        : "—"}
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Current winery
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-[var(--retro-text)] mb-1 min-h-[28px] flex items-center justify-center">
                      {progress.currentWine
                        ? truncateText(progress.currentWine, 15)
                        : "—"}
                    </div>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      Current wine
                    </div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm text-[var(--retro-text-muted)] mb-1">
                      <span>Wineries progress</span>
                      <span>
                        {Math.round(
                          (progress.processedWineries /
                            progress.totalWineries) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="progress-bar w-full h-2">
                      <div
                        className="progress-bar-fill transition-all duration-300"
                        style={{
                          width: `${
                            (progress.processedWineries /
                              progress.totalWineries) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-[var(--retro-text-muted)] mb-1">
                      <span>Wines progress</span>
                      <span>
                        {Math.round(
                          (progress.processedWines / progress.totalWines) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="progress-bar w-full h-2">
                      <div
                        className="progress-bar-fill transition-all duration-300"
                        style={{
                          width: `${
                            (progress.processedWines / progress.totalWines) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Console - Show for both single and bulk modes */}
            <div className="bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-[var(--retro-border)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--retro-accent)]">
                    🖥️ Terminal Console
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[var(--retro-text-muted)]">
                      {consoleLogs.length} logs
                    </span>
                    <button
                      onClick={clearConsole}
                      className="text-xs text-[var(--retro-text-muted)] hover:text-[var(--retro-text)] transition-colors"
                      title="Clear console"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>
                <div className="text-sm text-[var(--retro-text-muted)]">
                  Real-time logging of all operations
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="bg-[var(--retro-bg)] border border-[var(--retro-border)] rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                  {consoleLogs.length === 0 ? (
                    <div className="text-[var(--retro-text-muted)] italic">
                      No logs yet. Start a process to see real-time updates...
                    </div>
                  ) : (
                    consoleLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`mb-2 ${
                          log.type === "error"
                            ? "text-[var(--retro-error)]"
                            : log.type === "success"
                            ? "text-[var(--retro-text)]"
                            : log.type === "warning"
                            ? "text-[var(--retro-warning)]"
                            : log.type === "step"
                            ? "text-[var(--retro-accent)] font-semibold"
                            : "text-[var(--retro-text)]"
                        }`}
                      >
                        <span className="text-[var(--retro-text-muted)]">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>{" "}
                        {log.message}
                      </div>
                    ))
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            </div>

            {/* Real-time Results Display - Only show in bulk mode */}
            {((progress?.mintingStatuses &&
              progress.mintingStatuses.length > 0) ||
              mintHistory.size > 0) &&
              mintingMode === "bulk" && (
                <div className="bg-[var(--retro-surface)] border border-[var(--retro-border)] rounded-lg">
                  <div className="px-6 py-4 border-b border-[var(--retro-border)]">
                    <h3 className="text-lg font-semibold text-[var(--retro-accent)]">
                      Minting results
                    </h3>
                    <div className="text-sm text-[var(--retro-text-muted)]">
                      {(() => {
                        const allStatuses =
                          progress?.mintingStatuses ||
                          Array.from(mintHistory.values());
                        const successful = allStatuses.filter(
                          (r) => r.status === "success"
                        ).length;
                        const failed = allStatuses.filter(
                          (r) => r.status === "failed"
                        ).length;
                        return `${successful} successful, ${failed} failed`;
                      })()}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {(
                      progress?.mintingStatuses ||
                      Array.from(mintHistory.values())
                    ).map((result, index) => (
                      <div
                        key={index}
                        className="px-6 py-3 border-b border-[var(--retro-border)] hover:bg-[var(--retro-surface-2)] transition-colors hover-glow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div
                              className={`status-icon ${getStatusClass(
                                result.status
                              )}`}
                            >
                              {getStatusIcon(result.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-[var(--retro-text)] text-truncate">
                                {(() => {
                                  const winery = wineries.find(
                                    (w) => w.id === result.wineryId
                                  );
                                  const wine = winery?.wines?.find(
                                    (w) => w.id === result.wineId
                                  );
                                  return (
                                    wine?.generalInfo?.collectionName ||
                                    `Wine ${result.wineId}`
                                  );
                                })()}
                              </div>
                              <div className="text-sm text-[var(--retro-text-muted)] text-truncate">
                                Winery:{" "}
                                {(() => {
                                  const winery = wineries.find(
                                    (w) => w.id === result.wineryId
                                  );
                                  return (
                                    winery?.info?.name ||
                                    `Winery ${result.wineryId}`
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1 ml-4">
                            <div
                              className={`badge ${getStatusClass(
                                result.status
                              )}`}
                            >
                              {result.status}
                            </div>
                            {result.txId && (
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                {/* Transaction ID Section */}
                                <div className="flex items-center space-x-2">
                                  <div className="text-xs text-[var(--retro-accent)] font-medium">
                                    Transaction ID:
                                  </div>
                                  <div
                                    className="text-xs text-[var(--retro-text)] font-mono bg-[var(--retro-bg)] px-2 py-1 rounded border border-[var(--retro-border)] max-w-32 truncate"
                                    title={result.txId}
                                  >
                                    {result.txId}
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() =>
                                        copyToClipboard(result.txId!)
                                      }
                                      className="text-[var(--retro-accent)] hover:text-[var(--retro-text)] transition-colors p-1"
                                      title="Copy transaction ID"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </button>
                                    <a
                                      href={`https://preview.cardanoscan.io/transaction/${result.txId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--retro-accent)] hover:text-[var(--retro-text)] transition-colors p-1"
                                      title="View on Cardano Preview Scan"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                    </a>
                                  </div>
                                </div>

                                {/* Asset Unit ID Section */}
                                {result.tokenRefId && (
                                  <div className="flex items-center space-x-2">
                                    <div className="text-xs text-[var(--retro-accent)] font-medium">
                                      Asset Unit ID:
                                    </div>
                                    <div
                                      className="text-xs text-[var(--retro-text)] font-mono bg-[var(--retro-bg)] px-2 py-1 rounded border border-[var(--retro-border)] max-w-32 truncate"
                                      title={result.tokenRefId}
                                    >
                                      {result.tokenRefId}
                                    </div>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() =>
                                          copyToClipboard(result.tokenRefId!)
                                        }
                                        className="text-[var(--retro-accent)] hover:text-[var(--retro-text)] transition-colors p-1"
                                        title="Copy asset unit ID"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </button>
                                      <a
                                        href={`https://preview.cardanoscan.io/token/${result.tokenRefId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--retro-text-muted)] hover:text-[var(--retro-accent)] transition-colors p-1"
                                        title="View on Cardano Preview Explorer"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {result.error && (
                              <div
                                className="text-xs text-[var(--retro-error)] text-right max-w-xs truncate"
                                title={result.error}
                              >
                                {result.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
