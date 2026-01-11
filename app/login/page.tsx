import { getSignInUrl, getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default async function LoginPage() {
  const signInUrl = await getSignInUrl();
  const signUpUrl = await getSignUpUrl();

  // Redirect to WorkOS sign-in
  redirect(signInUrl);

  // Fallback UI (won't render due to redirect)
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Welcome Back</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Sign in to CrowdKavach</p>
        </div>
        
        <div className="space-y-4">
          <Link
            href={signInUrl}
            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href={signUpUrl}
            className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors font-medium"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
