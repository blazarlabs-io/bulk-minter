import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!imageUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Invalid image URL. Must be HTTPS" },
        { status: 400 }
      );
    }

    // Download the image from Firebase Storage
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to download image: ${response.status} ${response.statusText}`,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image as a response
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": imageBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Error downloading image:", error);
    return NextResponse.json(
      {
        error: "Failed to download image",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
