

import Link from 'next/link';
import { getSignUpUrl, withAuth } from '@workos-inc/authkit-nextjs';
import DashboardUI from '@/components/DashboardUI';

export default async function HomePage() {
  // Retrieves the user from the session or returns `null` if no user is signed in
  const { user } = await withAuth();

  // Get the URL to redirect the user to AuthKit to sign up
  const signUpUrl = await getSignUpUrl();

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
        <h1 className="text-3xl font-bold tracking-widest text-cyan-500">CROWDKAVACH ACCESS RESTRICTED</h1>
        <div className="flex gap-4">
          <a href="/login" className="px-6 py-2 bg-cyan-900/30 border border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors">LOGIN</a>
          <Link href={signUpUrl} className="px-6 py-2 bg-cyan-900/30 border border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors">REQUEST ACCESS</Link>
        </div>
      </div>
    );
  }

  return <DashboardUI user={user} />;
}
