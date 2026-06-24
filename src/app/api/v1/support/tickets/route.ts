import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { ticketSchema } from "@/lib/validations";
import { createTicket, listTickets, addTicketMessage } from "@/services/notification.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const page = parseInt(new URL(request.url).searchParams.get("page") ?? "1", 10);
    const tickets = await listTickets({
      userId: session.user.role === "ADMIN" ? undefined : session.user.id,
      page,
    });
    return Response.json({ data: tickets });
  });
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = ticketSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } }, { status: 422 });
      }

      const ticket = await createTicket(
        session.user.id,
        parsed.data.subject,
        parsed.data.category,
        parsed.data.body,
      );

      return Response.json({ data: ticket }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();
    const ticket = await addTicketMessage(body.ticketId, session.user.id, body.body, body.isInternal);
    return Response.json({ data: ticket });
  });
}
