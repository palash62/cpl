import { withAuth } from "@/lib/api-handler";
import { getStripePublishableKeyForAdvertiser } from "@/services/stripe-payment.service";

export async function GET() {
  return withAuth(async () => {
    const data = await getStripePublishableKeyForAdvertiser();
    return Response.json({ data });
  }, ["ADVERTISER", "ADMIN"]);
}
