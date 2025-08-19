import { env, checkRequiredEnvVars } from "@/env";
import { AssetResponse, MintBatchResponse } from "./types";

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

// Helper function to create basic auth header
const create_auth_header = (): string => {
  if (!env.TOKENIZATION_API_USERNAME || !env.TOKENIZATION_API_PASSWORD) {
    throw new Error(
      "Missing TOKENIZATION_API_USERNAME or TOKENIZATION_API_PASSWORD environment variables"
    );
  }

  const credentials = `${env.TOKENIZATION_API_USERNAME}:${env.TOKENIZATION_API_PASSWORD}`;
  return `Basic ${btoa(credentials)}`;
};

// Helper function to handle API responses
const handle_response = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error_text = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${error_text}`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Failed to parse API response");
  }
};

export class TokenizationApiService {
  private base_url: string;
  private auth_header: string;

  constructor() {
    // Don't instantiate during SSR
    if (!isBrowser) {
      throw new Error(
        "TokenizationApiService cannot be instantiated during SSR"
      );
    }

    // Check if required environment variables are set
    if (!checkRequiredEnvVars()) {
      throw new Error(
        "Missing required environment variables. Please check your .env.local file."
      );
    }

    this.base_url = env.TOKENIZATION_API_URL!;
    this.auth_header = create_auth_header();
  }

  /**
   * Retrieve asset information by unit
   * GET /wine/<asset.unit>
   */
  async retrieve_asset(asset_unit: string): Promise<AssetResponse> {
    const url = `${this.base_url}/wine/${encodeURIComponent(asset_unit)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.auth_header,
        "Content-Type": "application/json",
      },
    });

    return handle_response<AssetResponse>(response);
  }

  /**
   * Add image to IPFS
   * POST /add
   */
  async add_image(file: File): Promise<string> {
    const url = `${this.base_url}/add`;

    const form_data = new FormData();
    form_data.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.auth_header,
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: form_data,
    });

    if (!response.ok) {
      const error_text = await response.text();
      throw new Error(
        `Image upload failed: ${response.status} ${response.statusText} - ${error_text}`
      );
    }

    // Return the raw string response (IPFS URL)
    return await response.text();
  }

  /**
   * Mint batch of assets
   * POST /mint-batch
   */
  async mint_batch(
    batch_data: Record<string, unknown>
  ): Promise<MintBatchResponse> {
    const url = `${this.base_url}/mint-batch`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.auth_header,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch_data),
    });

    return handle_response<MintBatchResponse>(response);
  }

  /**
   * Test the API connection
   */
  async test_connection(): Promise<boolean> {
    try {
      // Try to retrieve a test asset or make a simple request
      const url = `${this.base_url}/health`; // Assuming there's a health endpoint

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: this.auth_header,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }

  /**
   * Get the current API configuration (for debugging)
   */
  get_config() {
    return {
      base_url: this.base_url,
      has_credentials:
        !!env.TOKENIZATION_API_USERNAME && !!env.TOKENIZATION_API_PASSWORD,
      ipfs_gateway: env.IPFS_GATEWAY,
    };
  }
}

// Lazy-loaded singleton instance
let _tokenization_api: TokenizationApiService | null = null;

export const get_tokenization_api = (): TokenizationApiService => {
  if (!_tokenization_api) {
    try {
      _tokenization_api = new TokenizationApiService();
    } catch (error) {
      console.error("Failed to initialize TokenizationApiService:", error);
      throw error;
    }
  }
  return _tokenization_api;
};

// Don't export the instance directly - only the getter
// export const tokenization_api = get_tokenization_api();
