import Link from 'next/link';
import { getSignUpUrl, getSignInUrl, withAuth } from '@workos-inc/authkit-nextjs';
import DashboardUI from '@/components/DashboardUI';

// Separate component for unauthenticated view
function UnauthenticatedView({ signInUrl, signUpUrl }: { signInUrl: string; signUpUrl: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 gap-4 transition-colors duration-200">
      <h1 className="text-3xl font-bold tracking-wide text-emerald-600 dark:text-emerald-400">CROWDKAVACH ACCESS RESTRICTED</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Please sign in to access the dashboard</p>
      <div className="flex gap-4 mt-4">
        <Link href={signInUrl} className="px-6 py-2 bg-emerald-600 border border-emerald-600 rounded-lg text-white hover:bg-emerald-700 transition-colors font-medium">
          LOGIN
        </Link>
        <Link href={signUpUrl} className="px-6 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors font-medium">
          SIGN UP
        </Link>
      </div>
    </div>
  );
}

// Separate component for error view
function AuthErrorView() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 gap-4 transition-colors duration-200">
      <h1 className="text-3xl font-bold tracking-wide text-red-600 dark:text-red-400">Authentication Error</h1>
      <p className="text-zinc-600 dark:text-zinc-400">There was a problem with authentication</p>
      <Link href="/" className="px-6 py-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-700 transition-colors font-medium mt-4">
        Go Home
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  let user = null;
  let signInUrl = '';
  let signUpUrl = '';
  let hasError = false;

  try {
    const authResult = await withAuth();
    user = authResult.user;
    
    if (!user) {
      signInUrl = await getSignInUrl();
      signUpUrl = await getSignUpUrl();
    }
  } catch (error) {
    console.error('Auth error:', error);
    hasError = true;
  }

  if (hasError) {
    return <AuthErrorView />;
  }

  if (!user) {
    return <UnauthenticatedView signInUrl={signInUrl} signUpUrl={signUpUrl} />;
  }

  return <DashboardUI user={user} />;
}
