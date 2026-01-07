import { withAuth } from '@workos-inc/authkit-nextjs';
import HeatMapPage from '@/components/HeatMapPage';

export default async function HeatMap() {
    const { user } = await withAuth();

    if (!user) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
                <h1 className="text-3xl font-bold tracking-widest text-cyan-500">CROWDKAVACH ACCESS RESTRICTED</h1>
                <div className="flex gap-4">
                    <a href="/login" className="px-6 py-2 bg-cyan-900/30 border border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors">LOGIN</a>
                </div>
            </div>
        );
    }

    return <HeatMapPage user={user} />;
}
