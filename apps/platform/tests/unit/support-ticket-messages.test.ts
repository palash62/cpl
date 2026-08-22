import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { isStaffSupportRole } from "@/lib/support-tickets";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  ticketMessage: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  supportTicket: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  deleteTicketMessage,
  updateTicketMessage,
} from "@/services/notification.service";

describe("isStaffSupportRole", () => {
  it("returns true for admin portal roles", () => {
    expect(isStaffSupportRole("ADMIN")).toBe(true);
    expect(isStaffSupportRole("PLATFORM_MANAGER")).toBe(true);
  });

  it("returns false for customer roles", () => {
    expect(isStaffSupportRole("ADVERTISER")).toBe(false);
    expect(isStaffSupportRole("PUBLISHER")).toBe(false);
    expect(isStaffSupportRole(null)).toBe(false);
  });
});

describe("support ticket message management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ role: "ADMIN" });
    prismaMock.ticketMessage.findUnique.mockResolvedValue({
      id: "msg-1",
      sender: { role: "ADMIN" },
      ticket: { id: "ticket-1" },
    });
    prismaMock.ticketMessage.update.mockResolvedValue({});
    prismaMock.ticketMessage.delete.mockResolvedValue({});
    prismaMock.supportTicket.update.mockResolvedValue({});
    prismaMock.supportTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      subject: "Help",
      messages: [],
      user: { id: "user-1", name: "User", email: "user@test.com", role: "ADVERTISER" },
    });
  });

  it("allows admin to edit a staff reply", async () => {
    const result = await updateTicketMessage("msg-1", "admin-1", "Updated reply");
    expect(result?.id).toBe("ticket-1");
    expect(prismaMock.ticketMessage.update).toHaveBeenCalledWith({
      where: { id: "msg-1" },
      data: { body: "Updated reply" },
    });
  });

  it("allows admin to delete a staff reply", async () => {
    const result = await deleteTicketMessage("msg-1", "admin-1");
    expect(result?.id).toBe("ticket-1");
    expect(prismaMock.ticketMessage.delete).toHaveBeenCalledWith({ where: { id: "msg-1" } });
  });

  it("forbids non-admin from editing", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "ADVERTISER" });
    await expect(updateTicketMessage("msg-1", "adv-1", "Nope")).rejects.toBeInstanceOf(AppError);
  });

  it("forbids editing user messages", async () => {
    prismaMock.ticketMessage.findUnique.mockResolvedValue({
      id: "msg-2",
      sender: { role: "ADVERTISER" },
      ticket: { id: "ticket-1" },
    });
    await expect(updateTicketMessage("msg-2", "admin-1", "Nope")).rejects.toBeInstanceOf(AppError);
  });

  it("requires non-empty body on edit", async () => {
    await expect(updateTicketMessage("msg-1", "admin-1", "   ")).rejects.toBeInstanceOf(AppError);
  });
});
