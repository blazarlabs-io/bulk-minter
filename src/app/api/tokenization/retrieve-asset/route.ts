import { NextRequest, NextResponse } from "next/server";

// Server-side environment variables
const TOKENIZATION_API_URL = process.env.TOKENIZATION_API_URL;
const TOKENIZATION_API_USERNAME = process.env.TOKENIZATION_API_USERNAME;
const TOKENIZATION_API_PASSWORD = process.env.TOKENIZATION_API_PASSWORD;

export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (
      !TOKENIZATION_API_URL ||
      !TOKENIZATION_API_USERNAME ||
      !TOKENIZATION_API_PASSWORD
    ) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 },
      );
    }

    // Get asset unit from query parameters
    const { searchParams } = new URL(request.url);
    const assetUnit = searchParams.get("unit");

    if (!assetUnit) {
      return NextResponse.json(
        { error: "Asset unit is required" },
        { status: 400 },
      );
    }

    // Create basic auth header
    const credentials = `${TOKENIZATION_API_USERNAME}:${TOKENIZATION_API_PASSWORD}`;
    const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

    // Make request to tokenization API
    const response = await fetch(
      `${TOKENIZATION_API_URL}/wine/${encodeURIComponent(assetUnit)}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "API request failed",
          status: response.status,
          statusText: response.statusText,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Asset retrieval failed:", error);
    return NextResponse.json(
      {
        error: "Asset retrieval failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
