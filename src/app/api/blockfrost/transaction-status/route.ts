import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get("txId");

    if (!txId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Get the API key from environment variables (server-side only)
    const apiKey = process.env.BLOCKFROST_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "BLOCKFROST_API_KEY environment variable not configured",
          details: "Please check your .env.local file",
        },
        { status: 500 }
      );
    }

    console.log(`🔍 Checking transaction status for: ${txId}`);

    // Use preview network for testing (you can make this configurable)
    const baseUrl = "https://cardano-preview.blockfrost.io/api/v0";
    console.log(`🔗 Using Blockfrost API: ${baseUrl}`);

    const response = await fetch(`${baseUrl}/txs/${txId}`, {
      method: "GET",
      headers: {
        project_id: apiKey,
        "Content-Type": "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.log(
        `❌ Blockfrost API response not OK: ${response.status} ${response.statusText}`
      );

      if (response.status === 404) {
        // Transaction not found - likely still pending
        console.log(
          `📝 Transaction not found (404) - returning pending status`
        );
        return NextResponse.json({
          status: "pending",
          details: "Transaction not yet found on blockchain",
          timestamp: new Date().toISOString(),
        });
      }

      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Blockfrost API error:`, errorData);
      return NextResponse.json(
        {
          error: `Blockfrost API request failed: ${response.status} ${response.statusText}`,
          details: errorData.message || "Unknown error",
        },
        { status: response.status }
      );
    }

    const txData = await response.json();
    console.log(`📊 Blockfrost response data:`, {
      hasBlock: !!txData.block,
      blockHeight: txData.block_height,
      txHash: txData.hash,
      timestamp: txData.timestamp,
    });

    // Check if transaction is confirmed
    if (txData.block && txData.block_height) {
      console.log(
        `✅ Transaction confirmed on blockchain at block ${txData.block_height}`
      );
      return NextResponse.json({
        status: "complete",
        details: "Transaction confirmed on blockchain",
        blockHeight: txData.block_height,
        confirmations: 1,
        timestamp: new Date().toISOString(),
      });
    }

    // Transaction exists but not yet confirmed
    console.log(`⏳ Transaction exists but not yet confirmed`);
    return NextResponse.json({
      status: "pending",
      details: "Transaction submitted but not yet confirmed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking transaction status:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          status: "error",
          details: "Request timeout - network issue",
          timestamp: new Date().toISOString(),
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        details: "Failed to check transaction status",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
