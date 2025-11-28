import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

// GET - Get event information by event_id
export async function GET(request: NextRequest) {
  try {
    if (!API_URL || !API_TOKEN) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json(
        { error: "event_id parameter is required" },
        { status: 400 }
      );
    }

    // Construct API URL untuk mendapatkan event info berdasarkan event_id
    // Asumsi endpoint: /api/v1/tiket/event/{event_id} atau serupa
    // Jika struktur berbeda, sesuaikan URL ini
    const baseUrl = API_URL.replace("/participant", "");
    const eventUrl = `${baseUrl}/event/${eventId}`;

    const response = await fetch(eventUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch event information", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching event information:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

