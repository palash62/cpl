import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { ticketSchema } from "@/lib/validations";
import { isAdminPortalRole } from "@/lib/admin-portal";
import {
  createTicket,
  listTickets,
  addTicketMessage,
  getTicketForUser,
  closeSupportTicket,
  updateTicketMessage,
  deleteTicketMessage,
} from "@/services/notification.service";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    const page = parseInt(new URL(request.url).searchParams.get("page") ?? "1", 10);
    const tickets = await listTickets({
      userId: isAdminPortalRole(session.user.role) ? undefined : session.user.id,
      hideInternal: !isAdminPortalRole(session.user.role),
      page,
    });
    return Response.json({ data: tickets });
  });
}

export async function POST(request: Request) {
  return withAuth(async (session) => {
    if (isAdminPortalRole(session.user.role)) {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Admins cannot create support tickets", status: 403 } },
        { status: 403 },
      );
    }

    try {
      const body = await request.json();
      const parsed = ticketSchema.safeParse(body);

      if (!parsed.success) {
        const message =
          parsed.error.issues[0]?.message ?? "Please check the form and try again";
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message, status: 422 } },
          { status: 422 },
        );
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
    try {
      const body = await request.json();
      const isAdmin = isAdminPortalRole(session.user.role);
      const action = body.action as string | undefined;

      if (action === "editMessage") {
        if (!isAdmin) {
          return Response.json(
            { error: { code: "FORBIDDEN", message: "Only admins can edit support messages", status: 403 } },
            { status: 403 },
          );
        }
        const messageId = body.messageId as string | undefined;
        const messageBody = typeof body.body === "string" ? body.body.trim() : "";
        if (!messageId) {
          return Response.json(
            { error: { code: "VALIDATION_ERROR", message: "Message ID is required", status: 422 } },
            { status: 422 },
          );
        }
        if (!messageBody) {
          return Response.json(
            { error: { code: "VALIDATION_ERROR", message: "Message body is required", status: 422 } },
            { status: 422 },
          );
        }
        const updated = await updateTicketMessage(messageId, session.user.id, messageBody);
        if (!updated) {
          return errorResponse(Errors.notFound("Ticket"));
        }
        return Response.json({ data: updated });
      }

      if (action === "deleteMessage") {
        if (!isAdmin) {
          return Response.json(
            { error: { code: "FORBIDDEN", message: "Only admins can delete support messages", status: 403 } },
            { status: 403 },
          );
        }
        const messageId = body.messageId as string | undefined;
        if (!messageId) {
          return Response.json(
            { error: { code: "VALIDATION_ERROR", message: "Message ID is required", status: 422 } },
            { status: 422 },
          );
        }
        const updated = await deleteTicketMessage(messageId, session.user.id);
        if (!updated) {
          return errorResponse(Errors.notFound("Ticket"));
        }
        return Response.json({ data: updated });
      }

      const ticketId = body.ticketId as string | undefined;
      if (!ticketId) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Ticket ID is required", status: 422 } },
          { status: 422 },
        );
      }

      if (action === "close") {
        if (!isAdmin) {
          return Response.json(
            { error: { code: "FORBIDDEN", message: "Only admins can close tickets", status: 403 } },
            { status: 403 },
          );
        }

        const ticket = await getTicketForUser(ticketId, session.user.id, true);
        if (!ticket) {
          return errorResponse(Errors.notFound("Ticket"));
        }

        const updated = await closeSupportTicket(ticketId);
        if (!updated) {
          return errorResponse(Errors.notFound("Ticket"));
        }

        return Response.json({ data: updated });
      }

      const messageBody = typeof body.body === "string" ? body.body.trim() : "";

      if (messageBody.length < 1) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Reply message is required", status: 422 } },
          { status: 422 },
        );
      }

      const ticket = await getTicketForUser(ticketId, session.user.id, isAdmin);

      if (!ticket) {
        return errorResponse(Errors.notFound("Ticket"));
      }

      if (ticket.status === "CLOSED") {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "This ticket is closed", status: 422 } },
          { status: 422 },
        );
      }

      const updated = await addTicketMessage(
        ticketId,
        session.user.id,
        messageBody,
        isAdmin ? Boolean(body.isInternal) : false,
      );

      return Response.json({ data: updated });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
