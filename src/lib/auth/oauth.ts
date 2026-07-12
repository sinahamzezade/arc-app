"use client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: { credential: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (cfg: Record<string, unknown>) => void;
        signIn: () => Promise<{
          authorization: { id_token: string };
        }>;
      };
    };
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.id = id;
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export async function getGoogleIdToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google sign-in is not configured");
  }

  await loadScript("https://accounts.google.com/gsi/client", "google-gsi");

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error("Google Identity Services unavailable"));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res.credential) resolve(res.credential);
        else reject(new Error("No Google credential"));
      },
    });
    window.google.accounts.id.prompt();
  });
}

export async function getAppleIdToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Apple sign-in is not configured");
  }

  await loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
    "apple-auth",
  );

  if (!window.AppleID?.auth) {
    throw new Error("Apple JS SDK unavailable");
  }

  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI:
      process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || window.location.origin,
    usePopup: true,
  });

  const result = await window.AppleID.auth.signIn();
  const token = result.authorization?.id_token;
  if (!token) throw new Error("No Apple identity token");
  return token;
}
