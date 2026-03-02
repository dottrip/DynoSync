import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
    display: "swap",
});

export const metadata: Metadata = {
    title: "DynoSync - AI-Powered Car Modification Archive",
    description: "Convert casual mod inputs into high-quality personalized performance dashboards. The digital garage for hardcore car enthusiasts.",
    keywords: ["DynoSync", "car modification", "performance dashboard", "dyno sheet", "AI tuning advisor"],
    authors: [{ name: "DynoSync Team" }],
    openGraph: {
        title: "DynoSync - Personal Performance Dashboard",
        description: "Your digital garage for logging mods, comparing dyno runs, and ranking on global vehicle leaderboards.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark scroll-smooth">
            <head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
            </head>
            <body className={`${spaceGrotesk.variable} font-sans antialiased min-h-screen flex flex-col`}>
                {children}
            </body>
        </html>
    );
}
