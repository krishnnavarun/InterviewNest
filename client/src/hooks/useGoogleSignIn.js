import { useCallback, useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;
function loadGoogleScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Google sign-in with a custom-styled button (OAuth token popup flow).
 * The server verifies the access token was issued for our client id.
 * Disabled automatically when VITE_GOOGLE_CLIENT_ID is not configured.
 */
export function useGoogleSignIn() {
  const [ready, setReady] = useState(false);
  const clientRef = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'openid email profile',
          callback: (response) => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            if (!pending) return;
            if (response.error || !response.access_token) pending.reject(new Error('Google sign-in was cancelled.'));
            else pending.resolve(response.access_token);
          },
          error_callback: (error) => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            pending?.reject(new Error(error?.type === 'popup_closed' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.'));
          },
        });
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const requestAccessToken = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!clientRef.current) return reject(new Error('Google sign-in is not available.'));
        pendingRef.current = { resolve, reject };
        clientRef.current.requestAccessToken({ prompt: 'select_account' });
      }),
    []
  );

  return { enabled: Boolean(CLIENT_ID), ready, requestAccessToken };
}
