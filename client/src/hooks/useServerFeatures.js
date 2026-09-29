import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Optional integrations configured on the server (voice in/out, Google sign-in).
// Assumes everything is available until the server says otherwise.
const DEFAULTS = { speechToText: true, textToSpeech: true, googleSignIn: true };
let cached = null;

export function useServerFeatures() {
  const [features, setFeatures] = useState(cached ?? DEFAULTS);

  useEffect(() => {
    if (cached) return;
    api
      .get('/health')
      .then((response) => {
        cached = { ...DEFAULTS, ...response.data.features };
        setFeatures(cached);
      })
      .catch(() => {});
  }, []);

  return features;
}
