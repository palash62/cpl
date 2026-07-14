import { withRealAdmin } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { resendAdvertiserVerificationEmail } from "@/services/admin.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return withRealAdmin(async (session) => {
    try {
      const result = await resendAdvertiserVerificationEmail(id, session.user.id);
      return Response.json({
        success: true,
        message: `Verification email sent to ${result.email}`,
        data: result,
      });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
