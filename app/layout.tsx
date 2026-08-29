import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SacredOps — Supervisor Portal",
  description:
    "SacredOps is an all-in-one construction operations platform connecting contractors, unions, workers, and trainers.",
  manifest: "/manifest.webmanifest",
  applicationName: "SacredOps",
  appleWebApp: {
    capable: true,
    title: "SacredOps",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050705",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Google Analytics 4. Set NEXT_PUBLIC_GA_ID (e.g. "G-XXXXXXXXXX") in Vercel
  // to turn it on — it tracks every app pageview, including the demo signup on
  // demo.sacredops.app. Filter GA by hostname to isolate demo traffic.
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-EEZN8JVJFB";
  // Meta (Facebook) Pixel — set NEXT_PUBLIC_FB_PIXEL_ID in Vercel to your Pixel
  // ID to turn it on. Tracks PageView automatically; the login page fires Lead /
  // CompleteRegistration on signup (see app/login/page.tsx).
  const FB_PIXEL = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "1573862441061857";

  return (
    <html lang="en">
      <body>{children}</body>
      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
              gtag('config', 'AW-18341083534');
            `}
          </Script>
        </>
      ) : null}

      {/* Microsoft Clarity — session recordings & heatmaps across the app. */}
      <Script id="ms-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "xq4xlm8mes");`}
      </Script>

      {/* PWA service worker — makes SacredOps installable (App Store / Play via
          PWABuilder) and gives an offline fallback. Network-first, no stale cache. */}
      <Script id="sw-register" strategy="afterInteractive">
        {`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`}
      </Script>

      {/* Meta (Facebook) Pixel — no-op unless NEXT_PUBLIC_FB_PIXEL_ID is set. */}
      {FB_PIXEL ? (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
            'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${FB_PIXEL}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </html>
  );
}
