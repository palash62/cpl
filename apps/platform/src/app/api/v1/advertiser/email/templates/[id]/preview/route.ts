import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { getTemplate, renderTemplate, sampleMergeData } from "@/modules/email-marketing";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  return withAuth(async (session) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      const template = await getTemplate(session.user.id, id);
      const mergeData = sampleMergeData(
        body.mergeData && typeof body.mergeData === "object"
          ? (body.mergeData as Record<string, string>)
          : undefined,
      );
      const data = {
        subject: renderTemplate(template.subject, mergeData),
        htmlBody: renderTemplate(template.htmlBody, mergeData),
        textBody: template.textBody ? renderTemplate(template.textBody, mergeData) : null,
      };
      return Response.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
