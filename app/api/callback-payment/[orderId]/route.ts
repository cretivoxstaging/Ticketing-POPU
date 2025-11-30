import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!API_URL || !API_TOKEN) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
      );
    }

    const paramOrderId = params?.orderId;
    const urlOrderId = (() => {
      try {
        const url = new URL(request.url);
        return url.pathname.split("/").filter(Boolean).pop() ?? null;
      } catch {
        return null;
      }
    })();
    const orderId = paramOrderId || urlOrderId;
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId param is required" },
        { status: 400 }
      );
    }

    // Construct callback payment URL
    // Get base URL by removing /participant from API_URL
    const baseUrl = API_URL.replace("/participant", "");
    const callbackUrl = `${baseUrl}/callback-payment/${orderId}`;

    const response = await fetch(callbackUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch callback payment", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching callback payment:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

