import { NextResponse } from "next/server";

const REFRESH_COOKIE = "refresh_token";
const REFRESH_PATH = "/api/v1/auth";

/**
 * Persist Nest refresh token as httpOnly cookie on the Next origin.
 * Used after login when JSON includes refreshToken (cookie may be stripped
 * by some proxies; this makes rotation reliable).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    refreshToken?: string;
    expiresIn?: number;
  } | null;

  const token = body?.refreshToken?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "refreshToken required" },
      { status: 400 },
    );
  }

  const isProd = process.env.NODE_ENV === "production";
  // Match backend JWT_REFRESH_TTL default (30d) unless client sends seconds.
  const maxAge = body?.expiresIn && body.expiresIn > 0 ? body.expiresIn : 30 * 24 * 60 * 60;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: REFRESH_PATH,
    maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    path: REFRESH_PATH,
    maxAge: 0,
  });
  return res;
}
