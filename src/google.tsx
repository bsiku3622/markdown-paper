import { useEffect, useRef, useState } from "react";
import { Text } from "@studio-baeks/paper-ui";
import { api } from "./cloud";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: "popup"; use_fedcm_for_button?: boolean }) => void;
      renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let script: Promise<GoogleIdentity> | undefined;
function loadGoogle() {
  return (script ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://accounts.google.com/gsi/client";
    el.async = true;
    el.onload = () => (window.google ? resolve(window.google) : reject(new Error("unavailable")));
    el.onerror = () => {
      script = undefined;
      el.remove();
      reject(new Error("unavailable"));
    };
    document.head.append(el);
  }));
}

// The OAuth client ID comes from the API, so enabling Google sign-in needs no web rebuild.
let config: Promise<string | null> | undefined;
export function useGoogleClient() {
  const [client, setClient] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    config ??= api<{ google: string | null }>("/auth/config").then((r) => r.google).catch(() => {
      config = undefined;
      return null;
    });
    void config.then((id) => live && setClient(id));
    return () => {
      live = false;
    };
  }, []);
  return client;
}

export function GoogleButton({ client, text = "continue_with", onCredential }: { client: string; text?: "continue_with" | "signup_with"; onCredential: (credential: string) => void }) {
  const host = useRef<HTMLDivElement>(null),
    callback = useRef(onCredential),
    [failed, setFailed] = useState(false);
  callback.current = onCredential;
  useEffect(() => {
    let live = true;
    loadGoogle()
      .then((google) => {
        if (!live || !host.current) return;
        // Google keeps one global callback; the visible button owns it while mounted.
        google.accounts.id.initialize({ client_id: client, callback: (r) => callback.current(r.credential), ux_mode: "popup" });
        google.accounts.id.renderButton(host.current, { type: "standard", theme: "outline", size: "large", shape: "rectangular", text, logo_alignment: "left", locale: "ko", width: Math.min(400, host.current.clientWidth || 320) });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [client, text]);
  return failed ? (
    <Text as="p" variant="caption" ink="tertiary">Google 로그인을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</Text>
  ) : (
    <div ref={host} className="google-button" />
  );
}
