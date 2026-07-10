import { countryFromRequestHeaders, getClientIp } from "@cpl/shared";

export function getLeadSubmissionGeo(request: Request) {
  return {
    ip: getClientIp(request.headers),
    headerCountry: countryFromRequestHeaders(request.headers),
  };
}
