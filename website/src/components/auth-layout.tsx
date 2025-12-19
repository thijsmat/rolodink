'use client';

import { Link } from '@/navigation';
import LinkedInSignInButton from '@/components/LinkedInSignInButton';
import { EmailPasswordForm } from '@/components/EmailPasswordForm';

type AuthLayoutProps = {
    mode: 'login' | 'signup';
    title: string;
    subtitle: string;
    oauthError: string | null;
    alternateLink: {
        text: string;
        linkText: string;
        href: string;
    };
};

export function AuthLayout({
    mode,
    title,
    subtitle,
    oauthError,
    alternateLink,
}: AuthLayoutProps) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-azure/10 bg-white/95 p-8 shadow-xl backdrop-blur">
                <div className="space-y-2 text-center">
                    <h1 className="font-playfair text-3xl font-semibold text-azure">{title}</h1>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>

                {oauthError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {oauthError}
                    </div>
                ) : null}

                <LinkedInSignInButton intent={mode} />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide text-muted-foreground">
                        <span className="bg-white px-2">Or continue with email</span>
                    </div>
                </div>

                <EmailPasswordForm mode={mode} />

                <p className="text-center text-sm text-muted-foreground">
                    {alternateLink.text}{' '}
                    <Link href={alternateLink.href} className="text-primary underline underline-offset-4">
                        {alternateLink.linkText}
                    </Link>
                </p>
            </div>
        </main>
    );
}

/**
 * Utility function to extract OAuth error from search params
 */
export function extractOAuthError(
    oauthErrorParam: string | string[] | undefined
): string | null {
    if (typeof oauthErrorParam === 'string') {
        return oauthErrorParam;
    }
    if (Array.isArray(oauthErrorParam) && oauthErrorParam.length > 0) {
        return oauthErrorParam[0];
    }
    return null;
}
