'use client';

import React, { useState } from 'react';
import CaptchaVerification from '@/components/CaptchaVerification';
import Link from 'next/link';

export default function VerifyPage() {
    const [token, setToken] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const handleVerify = (t: string) => {
        setToken(t);
    };

    const submitToServer = async () => {
        if (!token) return;

        setIsVerifying(true);
        setVerificationResult(null);

        try {
            const res = await fetch('https://dynosync-api.dynosync-dev.workers.dev/public/verify-captcha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (data.success) {
                setVerificationResult({
                    success: true,
                    message: 'Backend verified: ' + data.message
                });
            } else {
                setVerificationResult({
                    success: false,
                    message: 'Backend rejected: ' + data.error
                });
            }
        } catch (err) {
            setVerificationResult({
                success: false,
                message: 'Network Error: Could not connect to API for verification.'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a1520] text-white flex flex-col items-center justify-center p-6 sm:p-24 font-sans uppercase">

            <div className="max-w-md w-full bg-[#0d1f30] border border-[#1c2e40] rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#258cf4] rounded-lg flex items-center justify-center font-black text-xl">D</div>
                    <h1 className="text-xl font-black tracking-widest">LOCAL SAFETY CHECK</h1>
                </div>

                <p className="text-[#4a6480] text-xs font-bold leading-relaxed mb-8 tracking-widest">
                    Due to your backend and data services now being in the cloud, all sensitive local actions must pass a Turnstile verification.
                </p>

                <div className="space-y-6">
                    <CaptchaVerification onVerify={handleVerify} />

                    <div className="pt-4">
                        <button
                            onClick={submitToServer}
                            disabled={!token || isVerifying}
                            className={`w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all ${token && !isVerifying
                                ? 'bg-[#3ea8ff] text-white shadow-[0_0_20px_rgba(62,168,255,0.3)] hover:scale-[1.02]'
                                : 'bg-[#1c2e40] text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                        >
                            {isVerifying ? 'VERIFYING...' : 'CONFIRM IDENTITY'}
                        </button>
                    </div>

                    {token && (
                        <div className="bg-[#1c2e40] rounded-lg p-4 mt-4 border border-[#3ea8ff]/20">
                            <span className="text-[#3ea8ff] text-[10px] font-black tracking-widest block mb-2 uppercase">CAPTCHA TOKEN CAPTURED //</span>
                            <p className="text-gray-400 text-[10px] break-all font-mono">
                                {token.substring(0, 100)}...
                            </p>
                        </div>
                    )}

                    {verificationResult && (
                        <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 border ${verificationResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${verificationResult.success ? 'bg-emerald-500' : 'bg-red-500'
                                }`}>
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {verificationResult.success ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    )}
                                </svg>
                            </div>
                            <p className={`text-xs font-bold tracking-tight ${verificationResult.success ? 'text-emerald-500' : 'text-red-500'
                                }`}>
                                {verificationResult.message}
                            </p>
                        </div>
                    )}

                </div>
            </div>

            <div className="mt-12">
                <Link href="/" className="text-[#4a6480] hover:text-[#3ea8ff] text-xs font-bold transition-all underline underline-offset-4 tracking-[3px]">
                    &larr; BACK TO HOME
                </Link>
            </div>

        </main>
    );
}
