import { NextRequest, NextResponse } from "next/server";

const OPINION_API_BASE = "https://openapi.opinion.trade/openapi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const apiKey = process.env.NEXT_PUBLIC_OPINION_API_KEY || "";
  const { path } = await params;
  const endpoint = "/" + path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${OPINION_API_BASE}${endpoint}${searchParams ? `?${searchParams}` : ""}`;

  console.log("[API Proxy] URL:", url, "API Key exists:", !!apiKey);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "apikey": apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error:", error);
    return NextResponse.json(
      { errno: -1, errmsg: "Proxy error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const apiKey = process.env.NEXT_PUBLIC_OPINION_API_KEY || "";
  const { path } = await params;
  const endpoint = "/" + path.join("/");
  const url = `${OPINION_API_BASE}${endpoint}`;
  const body = await request.json();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Error:", error);
    return NextResponse.json(
      { errno: -1, errmsg: "Proxy error" },
      { status: 500 }
    );
  }
}
