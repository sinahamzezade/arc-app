import type { Profile } from "@/lib/api/types";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    expiresIn?: number;
    profile?: Profile;
    /** Arlo stores verification as boolean on JWT/session */
    arcEmailVerified?: boolean;
  }

  interface Session {
    accessToken?: string;
    /** Epoch ms when access JWT should be treated as expired. */
    accessTokenExpires?: number;
    profile?: Profile | null;
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    emailVerified?: boolean;
    profile?: Profile;
    id?: string;
  }
}
