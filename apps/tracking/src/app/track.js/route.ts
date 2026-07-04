import { getTrackingUrl } from "@cpl/shared";

export async function GET() {
  const trackingUrl = getTrackingUrl();
  const script = `(function(){
  var w=window,d=document,s=w.location.search,p=new URLSearchParams(s),slug=p.get("slug")||w.__cplSlug;
  if(!slug)return;
  var src=p.get("src"),sub=p.get("sub_id");
  fetch("${trackingUrl}/api/v1/beacon",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({slug:slug,referrer:d.referrer||undefined,source:src,sub_id:sub})}).catch(function(){});
})();`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
