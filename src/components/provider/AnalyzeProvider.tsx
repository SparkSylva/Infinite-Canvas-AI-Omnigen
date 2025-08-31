'use client'
import Script from 'next/script'
import {  google_analytics_id, clarity_id, google_adsense_id } from "@/lib/custom";


export default function AnalyzeProvider({ }) {


    return (
        <>
            {/* mircosoft clarity */}
            {clarity_id && (
            <Script
                id="clarity-script"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarity_id}");`,
                }}
            />
            )}
            {/* google adsence */}
            {google_adsense_id && (
                <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${google_adsense_id}`} crossOrigin="anonymous"></script>
            )}

            {/* google analyic */}
            {google_analytics_id && (
                <Script async src={`https://www.googletagmanager.com/gtag/js?id=${google_analytics_id}`} />
            )}

            {google_analytics_id && (
            <Script
                id="google"
                dangerouslySetInnerHTML={{
                    __html: `window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                    gtag('config', '${google_analytics_id}');`,
                }}
                ></Script>
            )}
        </>
    );
}