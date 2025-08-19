export interface TransactionStatus {
  status: "pending" | "complete" | "error";
  details?: string;
  blockHeight?: number;
  confirmations?: number;
}

export interface BlockfrostError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Fetches transaction status from Blockfrost API
 * @param txId - The transaction ID to check
 * @returns Promise<TransactionStatus> - The transaction status
 */
export async function getTransactionStatus(
  txId: string
): Promise<TransactionStatus> {
  try {
    const apiKey = process.env.BLOCKFROST_API_KEY;

    if (!apiKey) {
      throw new Error("BLOCKFROST_API_KEY environment variable not configured");
    }

    // Use preprod network for testing (you can make this configurable)
    const baseUrl = "https://cardano-preprod.blockfrost.io/api/v0";

    const response = await fetch(`${baseUrl}/txs/${txId}`, {
      method: "GET",
      headers: {
        project_id: apiKey,
        "Content-Type": "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Transaction not found - likely still pending
        return {
          status: "pending",
          details: "Transaction not yet found on blockchain",
        };
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Blockfrost API request failed: ${response.status} ${
          response.statusText
        } - ${errorData.message || "Unknown error"}`
      );
    }

    const txData = await response.json();

    // Check if transaction is confirmed
    if (txData.block && txData.block_height) {
      return {
        status: "complete",
        details: "Transaction confirmed on blockchain",
        blockHeight: txData.block_height,
        confirmations: 1, // You could calculate actual confirmations if needed
      };
    }

    // Transaction exists but not yet confirmed
    return {
      status: "pending",
      details: "Transaction submitted but not yet confirmed",
    };
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("Blockfrost API request timed out after 10 seconds");
        return {
          status: "error",
          details: "Request timeout - network issue",
        };
      } else {
        console.error("Blockfrost API request failed:", error.message);
        return {
          status: "error",
          details: error.message,
        };
      }
    } else {
      console.error("Unknown error in Blockfrost API request:", error);
      return {
        status: "error",
        details: "Unknown error occurred",
      };
    }
  }
}

/**
 * Fetches transaction status with retry logic
 * @param txId - The transaction ID to check
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in milliseconds (default: 1000)
 * @returns Promise<TransactionStatus> - The transaction status
 */
export async function getTransactionStatusWithRetry(
  txId: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<TransactionStatus> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await getTransactionStatus(txId);

      if (result.status !== "error") {
        return result;
      }

      // If we got an error status, throw to trigger retry
      throw new Error(result.details || "Transaction status check failed");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < maxRetries) {
        console.warn(
          `Blockfrost API attempt ${attempt} failed, retrying in ${retryDelay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        // Exponential backoff
        retryDelay *= 2;
      }
    }
  }

  console.error(
    `Blockfrost API failed after ${maxRetries} attempts. Last error:`,
    lastError?.message
  );
  return {
    status: "error",
    details: `Failed after ${maxRetries} attempts: ${lastError?.message}`,
  };
}
