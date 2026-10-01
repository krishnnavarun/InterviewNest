import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn's class-name helper: merges conditional classes and resolves
// conflicting Tailwind utilities (the last one wins).
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
