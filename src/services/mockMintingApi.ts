import { MintRequest, MintResponse } from '@/types/minting';

// Generate realistic Cardano transaction IDs (64 character hex strings)
const generateMockTxId = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate realistic Cardano token reference IDs (56 character hex strings)
const generateMockTokenRefId = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 56; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Simulate network delay and processing time
const simulateMintingDelay = async (): Promise<void> => {
  const delay = Math.random() * 3000 + 2000; // 2-5 seconds
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Mock minting API that simulates real blockchain minting
export class MockMintingApi {
  private static instance: MockMintingApi;
  private mintingQueue: Set<string> = new Set();

  static getInstance(): MockMintingApi {
    if (!MockMintingApi.instance) {
      MockMintingApi.instance = new MockMintingApi();
    }
    return MockMintingApi.instance;
  }

  async mintWine(request: MintRequest): Promise<MintResponse> {
    const requestId = `${request.wineryId}-${request.wineId}`;
    
    // Check if already minting
    if (this.mintingQueue.has(requestId)) {
      throw new Error('Wine is already being minted');
    }

    // Add to minting queue
    this.mintingQueue.add(requestId);

    try {
      // Simulate minting process
      console.log(`[MOCK API] Starting mint for wine ${request.wineId} from winery ${request.wineryId}`);
      
      // Simulate processing delay
      await simulateMintingDelay();

      // Simulate occasional failures (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Simulated minting failure - network timeout');
      }

      // Generate mock response
      const response: MintResponse = {
        success: true,
        txId: generateMockTxId(),
        tokenRefId: generateMockTokenRefId(),
      };

      console.log(`[MOCK API] Successfully minted wine ${request.wineId}:`, response);
      return response;

    } catch (error) {
      console.error(`[MOCK API] Failed to mint wine ${request.wineId}:`, error);
      return {
        success: false,
        txId: '',
        tokenRefId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Remove from minting queue
      this.mintingQueue.delete(requestId);
    }
  }

  // Get minting queue status
  getMintingQueueStatus(): string[] {
    return Array.from(this.mintingQueue);
  }

  // Clear minting queue (for testing)
  clearMintingQueue(): void {
    this.mintingQueue.clear();
  }
}
