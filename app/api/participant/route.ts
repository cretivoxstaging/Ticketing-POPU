import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

interface Participant {
  id?: number | null;
  name: string;
  email: string;
  whatsapp: string;
  event_id: number;
  type_ticket: string;
  date_ticket?: string | null;
  qty: number;
  total_paid?: number | null;
  order_id?: string | null;
  qr_code?: string | null;
  ispaid?: number | null;
  date_paid?: string | null;
  status?: string | null;
  clock_in?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
}

// GET - Read all participants
export async function GET(request: NextRequest) {
  try {
    if (!API_URL || !API_TOKEN) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
      );
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch participants", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create new participant
export async function POST(request: NextRequest) {
  try {
    if (!API_URL || !API_TOKEN) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
      );
    }

    const body: Partial<Participant> = await request.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to create participant", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating participant:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

