import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware({
    redirectUri: process.env.WORKOS_REDIRECT_URI || 'http://localhost:3001/api/auth/callback',
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
