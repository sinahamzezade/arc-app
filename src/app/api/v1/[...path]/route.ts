import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND =
  (process.env.API_PROXY_ORIGIN || "http://localhost:9000").replace(/\/$/, "");

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const target = `${BACKEND}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new NextResponse(upstream.body, { status: upstream.status });

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") return;
    if (HOP_BY_HOP.has(lower)) return;
    out.headers.set(key, value);
  });

  // Preserve every Set-Cookie (Nest refresh_token). get()/set() collapses multiples.
  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      out.headers.append("set-cookie", cookie);
    }
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) out.headers.append("set-cookie", single);
  }

  return out;
}

export function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export function OPTIONS(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
