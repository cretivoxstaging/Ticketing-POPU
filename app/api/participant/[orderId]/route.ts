import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

export async function PUT(
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

    const body = await request.json();
    const requiredFields = [
      "name",
      "email",
      "whatsapp",
      "type_ticket",
      "qty",
      "event_id",
    ] as const;

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const targetUrl = `${API_URL}/${orderId}`;
    const response = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to update participant", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

