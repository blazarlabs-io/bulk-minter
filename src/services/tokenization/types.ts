export interface AssetResponse {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
}

export interface AddImageResponse {
  success: boolean;
  ipfsUrl?: string;
  message?: string;
  error?: string;
}

export interface MintBatchResponse {
  success: boolean;
  txId?: string;
  message?: string;
  error?: string;
}
