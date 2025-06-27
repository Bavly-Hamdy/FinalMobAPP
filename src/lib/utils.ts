
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for Tailwind conditional merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debounce function: delays function call until after wait ms have elapsed.
 * Can be used with React setState to avoid flicker or unnecessary intermediate updates.
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  } as T;
}
