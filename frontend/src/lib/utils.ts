import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase().trim();
  const hardcodedAdmins = [
    'sujoymoulick05@gmail.com',
    'somnath.uem0@gmail.com',
    'basakarnab430@gmail.com'
  ];
  if (hardcodedAdmins.includes(lowerEmail)) {
    return true;
  }
  
  const adminEmails = [import.meta.env.VITE_ADMIN_EMAIL];
  
  const contributorEmails = import.meta.env.VITE_CONTRIBUTOR_EMAILS;
  if (contributorEmails) {
    adminEmails.push(...contributorEmails.split(',').map((e: string) => e.trim()));
  }
  
  return adminEmails.some(e => e && e.toLowerCase().trim() === lowerEmail);
}

export function getAdminRoleTitle(email: string | null | undefined): string | null {
  if (!email) return null;
  const lowerEmail = email.toLowerCase().trim();
  if (lowerEmail === 'sujoymoulick05@gmail.com') {
    return 'Founder';
  }
  if (lowerEmail === 'somnath.uem0@gmail.com' || lowerEmail === 'basakarnab430@gmail.com') {
    return 'Co-Founder';
  }
  if (isAdminEmail(email)) {
    return 'Administrator';
  }
  return null;
}
