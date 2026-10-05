import Script from "next/script";

// Google Tag Manager for a tenant site (site_settings.gtm_container_id,
// set in Dashboard → Analytics). One component shared by the (site) and
// (marketing) layouts so the tenant homepage is tagged too.
export const GTM_ID_RE = /^GTM-[A-Z0-9]+$/;

export function GoogleTagManager({ id }: { id: string | null | undefined }) {
  // Validated on save, re-checked here because the id is interpolated into a script.
  if (!id || !GTM_ID_RE.test(id)) return null;
  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
      </Script>
      <noscript>
        <iframe src={`https://www.googletagmanager.com/ns.html?id=${id}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
      </noscript>
    </>
  );
}
