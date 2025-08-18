import { Winery } from "@/types/minting";

export async function loadWineriesData(): Promise<Winery[]> {
  try {
    console.log("[DATA LOADER] Attempting to fetch wineries from API...");

    // In a real app, this would be an API call
    // For now, we'll import the JSON file directly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/api/wineries", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(
      "[DATA LOADER] API response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load wineries data: ${response.status} ${response.statusText}`
      );
    }

    const wineries: Winery[] = await response.json();
    console.log("[DATA LOADER] Raw API response:", wineries);

    // Filter only wineries that have wines
    // Note: The actual data doesn't have a 'status' field, so we'll just check if wines exist
    const validWineries = wineries.filter(
      (winery) => winery.wines && winery.wines.length > 0
    );

    console.log(
      `[DATA LOADER] Loaded ${wineries.length} total wineries, ${validWineries.length} valid for minting`
    );

    if (validWineries.length === 0) {
      console.warn(
        "[DATA LOADER] No valid wineries found, falling back to mock data"
      );
      return getMockWineriesData();
    }

    return validWineries;
  } catch (error) {
    console.error("[DATA LOADER] Error loading wineries data:", error);

    if (error instanceof Error && error.name === "AbortError") {
      console.error("[DATA LOADER] Request timed out after 10 seconds");
    }

    console.log("[DATA LOADER] Falling back to mock data...");

    // Return mock data for testing if the API fails
    return getMockWineriesData();
  }
}

// Mock data for testing when API is not available
function getMockWineriesData(): Winery[] {
  console.log("[DATA LOADER] Using mock wineries data");
  return [
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
  ];
}
