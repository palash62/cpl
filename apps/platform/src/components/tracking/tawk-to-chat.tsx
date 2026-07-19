import Script from "next/script";

const DEFAULT_PROPERTY_PATH = "6a5c7630aa83a11d48ca4b80/1jtsirc0m";

/**
 * Site-wide Tawk.to chat widget.
 * Set NEXT_PUBLIC_TAWK_TO_PROPERTY_PATH="" to disable.
 */
export function TawkToChat() {
  const propertyPath =
    process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_PATH?.trim() ?? DEFAULT_PROPERTY_PATH;

  if (!propertyPath) return null;

  const src = `https://embed.tawk.to/${propertyPath}`;

  return (
    <Script id="tawk-to-chat" strategy="afterInteractive">
      {`
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src=${JSON.stringify(src)};
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
      `}
    </Script>
  );
}
