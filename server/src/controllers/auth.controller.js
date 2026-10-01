import { z } from 'zod';
import * as authService from '../services/auth.service.js';

export const RegisterBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.email('Enter a valid email').transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const LoginBody = z.object({
  email: z.email('Enter a valid email').transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'Password is required').max(128),
});

export const GoogleBody = z.object({
  accessToken: z.string().min(10).max(4096),
});

export async function google(req, res) {
  res.json({ success: true, data: await authService.loginWithGoogle(req.body.accessToken) });
}

export async function register(req, res) {
  res.status(201).json({ success: true, data: await authService.register(req.body) });
}

export async function login(req, res) {
  res.json({ success: true, data: await authService.login(req.body) });
}

export function me(req, res) {
  res.json({ success: true, data: req.user.toPublic() });
}
