export interface IotStorageData {
  data: Record<string, unknown> | null; // Generic object structure for IoT data
  timestamp?: string;
  status?: string;
}

export interface IotStorageError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Fetches IoT storage data from the sensors API
 * @returns Promise<IotStorageData | null> - The IoT data or null if failed
 */
export async function getIotStorageData(): Promise<IotStorageData | null> {
  try {
    // Use our server-side API route instead of direct environment variable access
    const response = await fetch("/api/iot-storage", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // Add timeout and caching options
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `IoT Storage API request failed: ${response.status} ${
          response.statusText
        } - ${errorData.message || "Unknown error"}`
      );
    }

    const storageData = await response.json();

    // Validate response structure
    if (!storageData || typeof storageData !== "object") {
      throw new Error("Invalid response format from IoT Storage API");
    }

    return {
      data: storageData.data || storageData,
      timestamp: new Date().toISOString(),
      status: "success",
    };
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("IoT Storage API request timed out after 10 seconds");
      } else {
        console.error("IoT Storage API request failed:", error.message);
      }
    } else {
      console.error("Unknown error in IoT Storage API request:", error);
    }

    // Return structured error data
    return {
      data: null,
      timestamp: new Date().toISOString(),
      status: "error",
    };
  }
}

/**
 * Fetches IoT storage data with retry logic
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in milliseconds (default: 1000)
 * @returns Promise<IotStorageData | null> - The IoT data or null if all retries failed
 */
export async function getIotStorageDataWithRetry(
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<IotStorageData | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await getIotStorageData();

      if (result && result.status === "success") {
        return result;
      }

      // If we got a response but it's an error, throw to trigger retry
      throw new Error("IoT Storage API returned error status");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < maxRetries) {
        console.warn(
          `IoT Storage API attempt ${attempt} failed, retrying in ${retryDelay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        // Exponential backoff
        retryDelay *= 2;
      }
    }
  }

  console.error(
    `IoT Storage API failed after ${maxRetries} attempts. Last error:`,
    lastError?.message
  );
  return null;
}

/**
 * Validates if the IoT storage data is valid for minting
 * @param data - The IoT storage data to validate
 * @returns boolean - True if data is valid for minting
 */
export function validateIotStorageData(data: unknown): boolean {
  if (!data) return false;

  // Add specific validation logic based on your data structure
  // For now, just check if it's a non-empty object
  return (
    typeof data === "object" && data !== null && Object.keys(data).length > 0
  );
}

/**
 * Formats IoT storage data for minting payload
 * @param data - The IoT storage data
 * @returns string - Formatted string for minting payload
 */
export function formatIotStorageDataForMinting(
  data: Record<string, unknown>
): string {
  try {
    if (!validateIotStorageData(data)) {
      return JSON.stringify({ error: "Invalid IoT data" });
    }

    // Add any specific formatting logic here
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error formatting IoT data for minting:", error);
    return JSON.stringify({ error: "Failed to format IoT data" });
  }
}
