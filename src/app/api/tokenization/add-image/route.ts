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

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form data" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for server-side processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create new FormData for the external API
    const externalFormData = new FormData();
    externalFormData.append(
      "file",
      new Blob([fileBuffer], { type: file.type }),
      file.name
    );

    // Forward the request to the external tokenization API
    const response = await fetch(`${apiUrl}/add`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        // Don't set Content-Type, let it be set automatically with boundary
      },
      body: externalFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `IPFS upload failed: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Get the raw text response (ipfs://<hash>)
    const ipfsUrl = await response.text();

    // Return the IPFS URL as plain text
    return new NextResponse(ipfsUrl, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error uploading image to IPFS:", error);
    return NextResponse.json(
      {
        error: "Failed to upload image to IPFS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
