import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { errorMessage } from '@/lib/api';
import { GoogleIcon, OrDivider } from './AuthLayout';

// Renders the "or" divider + Google button only when Google sign-in is configured.
export function GoogleSignInSection({ label, onSuccess, variant = 'dark', alwaysShow = false }) {
  const { enabled, ready, requestAccessToken } = useGoogleSignIn();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!enabled && !alwaysShow) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (!enabled) {
        throw new Error('Google sign-in is not configured yet.');
      }
      const accessToken = await requestAccessToken();
      const user = await loginWithGoogle(accessToken);
      onSuccess?.(user);
    } catch (error) {
      if (!/cancelled/i.test(error.message)) toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OrDivider light={variant === 'light'} />
      <Button type="button" variant={variant === 'light' ? 'light' : 'dark'} size="lg" className="w-full text-base shadow-none" onClick={handleClick} loading={loading} disabled={alwaysShow ? false : !ready}>
        {!loading && <GoogleIcon className="size-[18px]" />}
        {label}
      </Button>
    </>
  );
}
