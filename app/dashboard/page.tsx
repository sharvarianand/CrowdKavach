import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import DashboardUI from '@/components/DashboardUI';
import AdminVerifyWrapper from '@/components/AdminVerifyWrapper';
import { SignInButton } from '@clerk/nextjs';

function UnauthenticatedView() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 gap-4 transition-colors duration-200">
      <h1 className="text-3xl font-bold tracking-wide text-emerald-600 dark:text-emerald-400">CROWDKAVACH ACCESS RESTRICTED</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Please sign in to access the dashboard</p>
      <div className="flex gap-4 mt-4">
        <SignInButton mode="modal">
          <button className="px-6 py-2 bg-emerald-600 border border-emerald-600 rounded-lg text-white hover:bg-emerald-700 transition-colors font-medium">
            LOGIN
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return <UnauthenticatedView />;
  }

  const user = {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  };

  return <AdminVerifyWrapper user={user} />;
}
