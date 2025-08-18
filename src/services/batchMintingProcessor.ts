import { Winery, MintRequest, MintingStatus, BatchMintingProgress } from '@/types/minting';
import { MockMintingApi } from './mockMintingApi';

export class BatchMintingProcessor {
  private mockApi: MockMintingApi;
  private isProcessing: boolean = false;
  private currentProgress: BatchMintingProgress;
  private onProgressUpdate?: (progress: BatchMintingProgress) => void;
  private onComplete?: (results: MintingStatus[]) => void;

  constructor() {
    this.mockApi = MockMintingApi.getInstance();
    this.currentProgress = {
      totalWineries: 0,
      processedWineries: 0,
      currentWinery: '',
      totalWines: 0,
      processedWines: 0,
      currentWine: '',
      mintingStatuses: [],
    };
  }

  // Set progress update callback
  setProgressCallback(callback: (progress: BatchMintingProgress) => void): void {
    this.onProgressUpdate = callback;
  }

  // Set completion callback
  setCompletionCallback(callback: (results: MintingStatus[]) => void): void {
    this.onComplete = callback;
  }

  // Start batch minting process
  async startBatchMinting(wineries: Winery[]): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Batch minting is already in progress');
    }

    this.isProcessing = true;
    
    // Calculate totals
    const totalWines = wineries.reduce((sum, winery) => sum + winery.wines.length, 0);
    
    this.currentProgress = {
      totalWineries: wineries.length,
      processedWineries: 0,
      currentWinery: '',
      totalWines,
      processedWines: 0,
      currentWine: '',
      mintingStatuses: [],
    };

    try {
      console.log(`[BATCH PROCESSOR] Starting batch minting for ${wineries.length} wineries with ${totalWines} total wines`);
      
      // Process wineries sequentially
      for (const winery of wineries) {
        if (!this.isProcessing) break; // Allow cancellation
        
        this.currentProgress.currentWinery = winery.info.name;
        this.updateProgress();
        
        console.log(`[BATCH PROCESSOR] Processing winery: ${winery.info.name} (${winery.wines.length} wines)`);
        
        // Process wines in this winery sequentially
        for (const wine of winery.wines) {
          if (!this.isProcessing) break; // Allow cancellation
          
          this.currentProgress.currentWine = `${wine.generalInfo.collectionName} - ${wine.generalInfo.type}`;
          this.updateProgress();
          
          console.log(`[BATCH PROCESSOR] Minting wine: ${wine.generalInfo.collectionName} - ${wine.generalInfo.type}`);
          
          // Create minting status entry
          const mintingStatus: MintingStatus = {
            wineId: wine.id,
            wineryId: winery.id,
            status: 'pending',
            timestamp: new Date(),
          };
          
          this.currentProgress.mintingStatuses.push(mintingStatus);
          this.updateProgress();
          
          try {
            // Update status to minting
            mintingStatus.status = 'minting';
            this.updateProgress();
            
            // Call mock API
            const mintRequest: MintRequest = {
              wineId: wine.id,
              wineryId: winery.id,
              wineData: wine,
            };
            
            const response = await this.mockApi.mintWine(mintRequest);
            
            if (response.success) {
              mintingStatus.status = 'success';
              mintingStatus.txId = response.txId;
              mintingStatus.tokenRefId = response.tokenRefId;
              console.log(`[BATCH PROCESSOR] Successfully minted wine ${wine.id}: ${response.txId}`);
            } else {
              mintingStatus.status = 'failed';
              mintingStatus.error = response.error;
              console.error(`[BATCH PROCESSOR] Failed to mint wine ${wine.id}: ${response.error}`);
            }
            
          } catch (error) {
            mintingStatus.status = 'failed';
            mintingStatus.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[BATCH PROCESSOR] Error minting wine ${wine.id}:`, error);
          }
          
          // Update progress
          this.currentProgress.processedWines++;
          this.updateProgress();
          
          // Small delay between wines to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Update winery progress
        this.currentProgress.processedWineries++;
        this.updateProgress();
        
        console.log(`[BATCH PROCESSOR] Completed winery: ${winery.info.name}`);
      }
      
      console.log('[BATCH PROCESSOR] Batch minting completed successfully!');
      
    } catch (error) {
      console.error('[BATCH PROCESSOR] Batch minting failed:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      
      // Call completion callback
      if (this.onComplete) {
        this.onComplete(this.currentProgress.mintingStatuses);
      }
    }
  }

  // Stop batch minting process
  stopBatchMinting(): void {
    this.isProcessing = false;
    console.log('[BATCH PROCESSOR] Batch minting stopped by user');
  }

  // Get current progress
  getCurrentProgress(): BatchMintingProgress {
    return { ...this.currentProgress };
  }

  // Check if currently processing
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Update progress and call callback
  private updateProgress(): void {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({ ...this.currentProgress });
    }
  }

  // Get minting results summary
  getMintingSummary(): {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  } {
    const total = this.currentProgress.mintingStatuses.length;
    const successful = this.currentProgress.mintingStatuses.filter(s => s.status === 'success').length;
    const failed = this.currentProgress.mintingStatuses.filter(s => s.status === 'failed').length;
    const pending = this.currentProgress.mintingStatuses.filter(s => s.status === 'pending').length;
    
    return { total, successful, failed, pending };
  }
}
