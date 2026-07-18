import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Profile } from "@/lib/api/types";

export class ArcCredentialsError extends CredentialsSignin {
  code: string;

  constructor(code: string, message?: string) {
    super(message || code);
    this.code = code;
  }
}

/**
 * Browser hits Nest auth first (via Next rewrite) so `refresh_token` httpOnly
 * cookie lands on the client. This provider only hydrates the Auth.js JWT
 * from that already-authenticated response — it must not call Nest again
 * (server-side fetch would drop Set-Cookie on the Node process).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "arc-bridge",
      name: "Arlo Bridge",
      credentials: {
        id: { label: "ID", type: "text" },
        email: { label: "Email", type: "email" },
        emailVerified: { label: "Verified", type: "text" },
        accessToken: { label: "Access", type: "text" },
        expiresIn: { label: "Expires", type: "text" },
        profile: { label: "Profile", type: "text" },
      },
      async authorize(credentials) {
        const id = String(credentials?.id ?? "");
        const email = String(credentials?.email ?? "");
        const accessToken = String(credentials?.accessToken ?? "");
        const expiresIn = Number(credentials?.expiresIn ?? 900);

        if (!id || !email || !accessToken) {
          throw new ArcCredentialsError(
            "VALIDATION_ERROR",
            "Incomplete session bridge payload",
          );
        }

        let profile: Profile | null = null;
        try {
          profile = JSON.parse(String(credentials?.profile ?? "null")) as Profile | null;
        } catch {
          profile = null;
        }

        return {
          id,
          email,
          emailVerified:
            credentials?.emailVerified === true ||
            credentials?.emailVerified === "true",
          accessToken,
          expiresIn: Number.isFinite(expiresIn) ? expiresIn : 900,
          profile: profile ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as typeof user & {
          accessToken?: string;
          expiresIn?: number;
          emailVerified?: boolean | Date | null;
          profile?: Profile;
        };
        token.id = u.id;
        token.email = u.email;
        token.accessToken = u.accessToken;
        token.profile = u.profile;
        token.accessTokenExpires = Date.now() + (u.expiresIn ?? 900) * 1000;
        Object.assign(token, {
          emailVerified: Boolean(u.emailVerified),
        });
      }

      if (trigger === "update" && session) {
        const patch = session as {
          accessToken?: string;
          expiresIn?: number;
          profile?: Profile;
          user?: { emailVerified?: boolean };
        };
        if (typeof patch.accessToken === "string") {
          token.accessToken = patch.accessToken;
          token.accessTokenExpires =
            Date.now() + (patch.expiresIn ?? 900) * 1000;
        }
        if (patch.profile) {
          token.profile = patch.profile;
        }
        if (patch.user?.emailVerified !== undefined) {
          token.emailVerified = Boolean(patch.user.emailVerified);
        }
      }

      return token;
    },
    async session({ session, token }) {
      const profile = token.profile ?? null;
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.accessTokenExpires =
        typeof token.accessTokenExpires === "number"
          ? token.accessTokenExpires
          : undefined;
      session.profile = profile;
      session.user = {
        ...session.user,
        id: String(token.id || token.sub || ""),
        email: String(token.email || session.user.email || ""),
        name:
          profile?.displayName ||
          profile?.username ||
          session.user.name ||
          null,
        image: profile?.avatarUrl || null,
      };
      // Custom boolean flag (Auth.js AdapterUser uses Date|null)
      (session.user as { emailVerified: boolean }).emailVerified = Boolean(
        token.emailVerified,
      );
      return session;
    },
  },
});
