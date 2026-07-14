import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = (
  process.env.API_PROXY_ORIGIN || "http://localhost:9000"
).replace(/\/$/, "");

type Ctx = { params: Promise<{ token: string }> };

/** First-party referral landing: record click, set arc_ref cookie, go register. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  let cookieToken: string | null = null;
  let referralCode: string | null = null;
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
        referralCode?: string | null;
      };
      cookieToken = body.cookieToken ?? null;
      referralCode = body.referralCode?.trim() || null;
      if (body.cookieMaxAgeSec) maxAge = body.cookieMaxAgeSec;
    }
  } catch {
    /* still send user to register */
  }

  const dest = referralCode
    ? `/register?ref=${encodeURIComponent(referralCode)}`
    : "/register";
  const res = NextResponse.redirect(new URL(dest, _req.url), 302);
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
