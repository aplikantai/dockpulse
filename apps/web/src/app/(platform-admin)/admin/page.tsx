import { redirect } from 'next/navigation';

/**
 * Platform Admin Index - Redirects to dashboard
 */
export default function PlatformAdminPage() {
  redirect('/admin/dashboard');
}

