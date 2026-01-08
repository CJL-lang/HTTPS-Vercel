import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

