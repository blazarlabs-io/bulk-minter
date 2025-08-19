export interface Wine {
  uid: string;
  id: string;
  createdAt: string;
  status: string;
  generalInfo: {
    wineryName: string;
    collectionName: string;
    type: string;
    vintage?: string;
    image?: string;
    grapeVarieties: Array<{
      name: string;
      percentage: string;
      vintage: string;
    }>;
  };
}

export interface Winery {
  id: string;
  info: {
    name: string;
  };
  wines: Wine[];
}

export interface MintRequest {
  wineId: string;
  wineryId: string;
  wineData: Wine;
}

export interface MintResponse {
  success: boolean;
  txId: string;
  tokenRefId: string;
  error?: string;
}

export interface MintingStatus {
  wineId: string;
  wineryId: string;
  status: "pending" | "minting" | "confirming" | "success" | "failed";
  txId?: string;
  tokenRefId?: string;
  error?: string;
  timestamp: Date;
}

export interface BatchMintingProgress {
  totalWineries: number;
  processedWineries: number;
  currentWinery: string;
  totalWines: number;
  processedWines: number;
  currentWine: string;
  mintingStatuses: MintingStatus[];
}

export interface MintPayload {
  batch_data: {
    info: string;
    mdata: string;
    minsrc: string;
  };
  batch_meta: {
    description: string;
    image: string;
    name: string;
  };
  batch_quantity: number[];
}
