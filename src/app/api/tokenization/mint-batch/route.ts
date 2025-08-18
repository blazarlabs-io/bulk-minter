import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get environment variables (server-side only)
    const username = process.env.TOKENIZATION_API_USERNAME;
    const password = process.env.TOKENIZATION_API_PASSWORD;
    const apiUrl = process.env.TOKENIZATION_API_URL;

    if (!username || !password || !apiUrl) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          details:
            "TOKENIZATION_API_USERNAME, TOKENIZATION_API_PASSWORD, or TOKENIZATION_API_URL not configured",
        },
        { status: 500 }
      );
    }

    // Create basic auth header
    const credentials = `${username}:${password}`;
    const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

    // Get the minting payload from the request
    const mintPayload = await request.json();

    if (!mintPayload) {
      return NextResponse.json(
        { error: "Mint payload is required" },
        { status: 400 }
      );
    }

    console.log(
      "🚀 Minting token with payload:",
      JSON.stringify(mintPayload, null, 2)
    );

    // Forward the request to the external tokenization API
    const response = await fetch(`${apiUrl}/tx/false/mint-batch`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mintPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Token minting failed: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Get the minting response
    const mintResult = await response.json();

    console.log("✅ Token minted successfully:", mintResult);

    return NextResponse.json(mintResult);
  } catch (error) {
    console.error("Error minting token:", error);
    return NextResponse.json(
      {
        error: "Failed to mint token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
