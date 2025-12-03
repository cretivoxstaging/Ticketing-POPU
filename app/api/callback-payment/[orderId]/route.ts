import { NextRequest, NextResponse } from "next/server";

const CALLBACK_URL = process.env.CALLBACK_URL;
const CALLBACK_TOKEN = process.env.CALLBACK_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!CALLBACK_URL || !CALLBACK_TOKEN) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
      );
    }

    // Ambil orderId dari params dinamis Next.js,
    // atau fallback dengan parsing dari URL jika params tidak tersedia.
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

    // Susun URL callback ke API eksternal.
    // CALLBACK_URL di .env sudah berupa: https://api-ticketing-ecru.vercel.app/callback-payment/
    // Jadi kita cukup menambahkan orderId saja, dan pastikan tidak ada double slash.
    const callbackUrl = CALLBACK_URL.endsWith("/")
      ? `${CALLBACK_URL}${orderId}`
      : `${CALLBACK_URL}/${orderId}`;

    const response = await fetch(callbackUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CALLBACK_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Please complete your payment.", details: errorText },
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

