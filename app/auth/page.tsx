import { redirect } from 'next/navigation';

export default function AuthRoot() {
  // Redirect /auth to the login page
  redirect('/auth/login');
  return null; // This line never runs
}
