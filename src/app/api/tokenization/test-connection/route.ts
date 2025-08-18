import { NextResponse } from "next/server";

// Server-side environment variables
const TOKENIZATION_API_URL = process.env.TOKENIZATION_API_URL;
const TOKENIZATION_API_USERNAME = process.env.TOKENIZATION_API_USERNAME;
const TOKENIZATION_API_PASSWORD = process.env.TOKENIZATION_API_PASSWORD;

export async function GET() {
  try {
    // Check if required environment variables are set
    if (
      !TOKENIZATION_API_URL ||
      !TOKENIZATION_API_USERNAME ||
      !TOKENIZATION_API_PASSWORD
    ) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          missing: {
            url: !TOKENIZATION_API_URL,
            username: !TOKENIZATION_API_USERNAME,
            password: !TOKENIZATION_API_PASSWORD,
          },
        },
        { status: 500 },
      );
    }

    // Create basic auth header
    const credentials = `${TOKENIZATION_API_USERNAME}:${TOKENIZATION_API_PASSWORD}`;
    const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

    // Test the connection
    const response = await fetch(
      `${TOKENIZATION_API_URL}/wine/34957659047139c2a282acc0b7c67871a5ef1bb67e4ad2787d2a1892.000643b0d7d90e688f9db72bd90e2e362f2bf20bd1598362baf9691c589ea5d3`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      },
    );

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        status: response.status,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Connection failed",
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    console.error("Tokenization API connection test failed:", error);
    return NextResponse.json(
      {
        error: "Connection test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
