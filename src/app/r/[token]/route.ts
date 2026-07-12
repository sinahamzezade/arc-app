import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = (
  process.env.API_PROXY_ORIGIN || "http://localhost:9000"
).replace(/\/$/, "");

type Ctx = { params: Promise<{ token: string }> };

/** First-party referral landing: record click, set arc_ref cookie, go signup. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  let cookieToken: string | null = null;
  let maxAge = 30 * 24 * 60 * 60;

  try {
    const upstream = await fetch(
      `${BACKEND}/api/v1/referrals/public/${encodeURIComponent(token)}/click`,
      { redirect: "manual", cache: "no-store" },
    );
    if (upstream.ok) {
      const body = (await upstream.json()) as {
        cookieToken?: string | null;
        cookieMaxAgeSec?: number | null;
      };
      cookieToken = body.cookieToken ?? null;
      if (body.cookieMaxAgeSec) maxAge = body.cookieMaxAgeSec;
    }
  } catch {
    /* still send user to signup */
  }

  const res = NextResponse.redirect(new URL("/signup", _req.url), 302);
  if (cookieToken) {
    res.cookies.set("arc_ref", cookieToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
  }
  return res;
}
