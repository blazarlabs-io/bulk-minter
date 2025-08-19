import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    // Get the API URL from environment variables (server-side only)
    const apiUrl = process.env.IOT_STORAGE_SENSORS_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        {
          error:
            "IOT_STORAGE_SENSORS_API_URL environment variable not configured",
          details: "Please check your .env.local file",
        },
        { status: 500 }
      );
    }

    console.log(`🔗 Fetching IoT data from: ${apiUrl}`);

    // Fetch data from the external IoT API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `IoT Storage API request failed: ${response.status} ${response.statusText}`,
          details: errorData.message || "Unknown error",
        },
        { status: response.status }
      );
    }

    const storageData = await response.json();

    // Validate response structure
    if (!storageData || typeof storageData !== "object") {
      return NextResponse.json(
        { error: "Invalid response format from IoT Storage API" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: storageData.data || storageData,
      timestamp: new Date().toISOString(),
      status: "success",
    });
  } catch (error) {
    console.error("Error fetching IoT storage data:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "IoT Storage API request timed out after 10 seconds" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch IoT storage data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
