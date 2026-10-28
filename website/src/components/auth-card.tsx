import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';

type AuthCardProps = {
    title: string;
    subtitle: string;
    notice?: string | null;
    children: ReactNode;
};

/** The card around the password-reset pages; same look as AuthLayout. */
export async function AuthCard({ title, subtitle, notice, children }: AuthCardProps) {
    const t = await getTranslations('Auth.common');
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-azure/10 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
                <div className="space-y-2 text-center">
                    <h1 className="font-playfair text-3xl font-semibold text-azure">{title}</h1>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>

                {notice ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {notice}
                    </div>
                ) : null}

                {children}

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="text-primary underline underline-offset-4">
                        {t('backToSignIn')}
                    </Link>
                </p>
            </div>
        </main>
    );
}
