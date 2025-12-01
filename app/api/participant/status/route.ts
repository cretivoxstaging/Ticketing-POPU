import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

export async function GET() {
  try {
    if (!API_URL || !API_TOKEN) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
      );
    }

    const statusUrl = `${API_URL}/status`;

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch participant statuses", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching participant statuses:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


