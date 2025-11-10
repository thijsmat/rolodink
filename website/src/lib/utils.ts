import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const DEFAULT_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExtensionUrl() {
  return process.env.NEXT_PUBLIC_EXTENSION_URL?.trim() || DEFAULT_EXTENSION_URL
}
