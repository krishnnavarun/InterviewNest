import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { AppError } from '../lib/AppError.js';

const session = (user) => ({ token: signToken(user), user: user.toPublic() });

export async function register({ name, email, password }) {
  const exists = await User.exists({ email });
  if (exists) throw new AppError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  return session(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (user && !user.password) {
    throw new AppError(401, 'This account uses Google sign-in. Continue with Google instead.');
  }
  // Same message for unknown email and wrong password (no account enumeration).
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, 'Invalid email or password.');
  }
  user.lastLoginAt = new Date();
  await user.save();
  return session(user);
}

/**
 * Sign in with a Google OAuth access token obtained in the browser.
 * We only trust the token after Google confirms it was issued to OUR client id
 * (prevents a token minted for another app being replayed here).
 */
export async function loginWithGoogle(accessToken) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'Google sign-in is not configured.');

  const infoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { signal: AbortSignal.timeout(10000) }
  );
  const info = await infoResponse.json().catch(() => ({}));
  if (!infoResponse.ok || info.aud !== env.GOOGLE_CLIENT_ID || !info.email) {
    throw new AppError(401, 'Google sign-in failed. Please try again.');
  }
  if (String(info.email_verified) !== 'true') {
    throw new AppError(401, 'Your Google email address is not verified.');
  }

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const profile = profileResponse.ok ? await profileResponse.json() : {};

  const email = info.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: (profile.name || email.split('@')[0]).slice(0, 60),
      email,
      googleId: info.sub,
      authProvider: 'google',
    });
  } else if (!user.googleId) {
    // Google has verified ownership of this email, so it is safe to link.
    user.googleId = info.sub;
  }
  user.lastLoginAt = new Date();
  await user.save();
  return session(user);
}
