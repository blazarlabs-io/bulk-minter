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

    // Generate unique request ID for debugging
    const requestId = Date.now() + Math.random().toString(36).substr(2, 9);

    console.log(`🔍 [${requestId}] Starting mint request`);
    console.log(
      `🔍 [${requestId}] Payload:`,
      JSON.stringify(mintPayload, null, 2)
    );

    // Forward the request to the external tokenization API
    const externalApiUrl = `${apiUrl}/tx/false/mint-batch`;
    console.log(`🔍 [${requestId}] Calling external API:`, externalApiUrl);
    console.log(`🔍 [${requestId}] Headers:`, {
      Authorization: authHeader.substring(0, 20) + "...",
      "Content-Type": "application/json",
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mintPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        `🔍 [${requestId}] Response status:`,
        response.status,
        response.statusText
      );
      console.log(
        `🔍 [${requestId}] Response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [${requestId}] External API error:`,
          response.status,
          response.statusText,
          errorText
        );

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

      console.log(`✅ [${requestId}] Token minted successfully:`, mintResult);

      return NextResponse.json(mintResult);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error(`❌ [${requestId}] Request timeout after 30 seconds`);
        return NextResponse.json(
          {
            error: "Request timeout",
            details: "External API request timed out after 30 seconds",
          },
          { status: 408 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("❌ Error minting token:", error);

    return NextResponse.json(
      {
        error: "Failed to mint token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
