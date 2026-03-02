'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CaptchaVerificationProps {
    onVerify: (token: string) => void;
    options?: {
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
    };
}

declare global {
    interface Window {
        onloadTurnstileCallback: () => void;
        turnstile: {
            render: (container: string | HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
            getResponse: (widgetId: string) => string;
        };
    }
}

export default function CaptchaVerification({ onVerify, options = { theme: 'dark' } }: CaptchaVerificationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cloudflare Turnstile Test Site Key (Always Passes)
    // https://developers.cloudflare.com/turnstile/troubleshooting/testing/
    const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    useEffect(() => {
        // Load Turnstile script
        const scriptId = 'cloudflare-turnstile-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        const checkLibrary = setInterval(() => {
            if (window.turnstile && containerRef.current && !widgetIdRef.current) {
                setIsLoaded(true);
                clearInterval(checkLibrary);

                const id = window.turnstile.render(containerRef.current, {
                    sitekey: SITE_KEY,
                    theme: options.theme,
                    size: options.size || 'normal',
                    callback: (token: string) => {
                        onVerify(token);
                    },
                    'error-callback': (err: any) => {
                        console.error('Turnstile Error:', err);
                    },
                });
                widgetIdRef.current = id;
            }
        }, 100);

        return () => {
            clearInterval(checkLibrary);
            if (widgetIdRef.current && window.turnstile) {
                // window.turnstile.remove(widgetIdRef.current); // Cleanup causes issues on some Next.js HMR
            }
        };
    }, [SITE_KEY, onVerify, options]);

    return (
        <div className="flex flex-col items-center justify-center py-4">
            {!isLoaded && (
                <div className="w-[300px] h-[65px] bg-[#0d1f30] animate-pulse rounded border border-[#1c2e40] flex items-center justify-center">
                    <span className="text-[#4a6480] text-xs font-bold tracking-widest">LOADING CAPTCHA...</span>
                </div>
            )}
            <div ref={containerRef} id="turnstile-container"></div>
            <p className="mt-2 text-[#4a6480] text-[10px] font-medium tracking-wide">
                Security check powered by Cloudflare
            </p>
        </div>
    );
}
