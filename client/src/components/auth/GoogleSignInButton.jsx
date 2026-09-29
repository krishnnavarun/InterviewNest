import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { errorMessage } from '@/lib/api';
import { GoogleIcon, OrDivider } from './AuthLayout';

// Renders the "or" divider + Google button only when Google sign-in is configured.
export function GoogleSignInSection({ label, onSuccess }) {
  const { enabled, ready, requestAccessToken } = useGoogleSignIn();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!enabled) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
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
      <OrDivider />
      <Button type="button" variant="dark" size="lg" className="w-full" onClick={handleClick} loading={loading} disabled={!ready}>
        {!loading && <GoogleIcon className="size-[18px]" />}
        {label}
      </Button>
    </>
  );
}
