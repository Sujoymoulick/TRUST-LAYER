import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = [import.meta.env.VITE_ADMIN_EMAIL];
  
  const contributorEmails = import.meta.env.VITE_CONTRIBUTOR_EMAILS;
  if (contributorEmails) {
    adminEmails.push(...contributorEmails.split(',').map((e: string) => e.trim()));
  }
  
  return adminEmails.includes(email);
}
