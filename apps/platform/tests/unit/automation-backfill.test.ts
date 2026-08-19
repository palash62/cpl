import { beforeEach, describe, expect, it, vi } from "vitest";

const enqueueEmailSend = vi.fn();

const prismaMock = {
  platformSetting: {
    findUnique: vi.fn(),
  },
  emailAutomation: {
    findUnique: vi.fn(),
  },
  emailContact: {
    findMany: vi.fn(),
  },
  emailSend: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/modules/email-marketing/queue/email-queue", () => ({
  enqueueEmailSend,
}));

describe("backfillAutomationForExistingContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.platformSetting.findUnique.mockResolvedValue({
      value: {
        enabled: true,
        maxAutomationsPerAdvertiser: 10,
        maxSendsPerDay: 5000,
        emailsPerDollar: 100,
      },
    });
  });

  it("queues sends for subscribed contacts on the automation campaign", async () => {
    const { backfillAutomationForExistingContacts } = await import(
      "@/modules/email-marketing/services/dispatch.service"
    );

    prismaMock.emailAutomation.findUnique.mockResolvedValue({
      id: "auto1",
      advertiserId: "adv1",
      status: "ACTIVE",
      campaignId: "camp1",
      listId: null,
      steps: [
        {
          id: "step1",
          type: "SEND_EMAIL",
          templateId: "tpl1",
          delayMinutes: 0,
        },
      ],
    });

    prismaMock.emailContact.findMany.mockResolvedValue([
      { id: "contact1", sourceLeadId: "lead1" },
    ]);

    prismaMock.emailSend.findFirst.mockResolvedValue(null);
    prismaMock.emailSend.create.mockResolvedValue({ id: "send1" });

    const result = await backfillAutomationForExistingContacts("auto1");

    expect(result).toEqual({ queuedSends: 1, contacts: 1 });
    expect(prismaMock.emailContact.findMany).toHaveBeenCalledWith({
      where: {
        advertiserId: "adv1",
        sourceCampaignId: { in: ["camp1"] },
        status: "SUBSCRIBED",
      },
      select: { id: true, sourceLeadId: true },
    });
    expect(prismaMock.emailSend.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          automationId: "auto1",
          stepId: "step1",
          contactId: "contact1",
          leadId: "lead1",
          status: "QUEUED",
        }),
      }),
    );
    expect(enqueueEmailSend).toHaveBeenCalledWith("send1", expect.any(Date));
  });

  it("skips when a send already exists for the contact and step", async () => {
    const { backfillAutomationForExistingContacts } = await import(
      "@/modules/email-marketing/services/dispatch.service"
    );

    prismaMock.emailAutomation.findUnique.mockResolvedValue({
      id: "auto1",
      advertiserId: "adv1",
      status: "ACTIVE",
      campaignId: "camp1",
      listId: null,
      steps: [
        {
          id: "step1",
          type: "SEND_EMAIL",
          templateId: "tpl1",
          delayMinutes: 0,
        },
      ],
    });

    prismaMock.emailContact.findMany.mockResolvedValue([
      { id: "contact1", sourceLeadId: "lead1" },
    ]);

    prismaMock.emailSend.findFirst.mockResolvedValue({ id: "existing" });

    const result = await backfillAutomationForExistingContacts("auto1");

    expect(result).toEqual({ queuedSends: 0, contacts: 1 });
    expect(prismaMock.emailSend.create).not.toHaveBeenCalled();
    expect(enqueueEmailSend).not.toHaveBeenCalled();
  });

  it("returns zero when automation is not active", async () => {
    const { backfillAutomationForExistingContacts } = await import(
      "@/modules/email-marketing/services/dispatch.service"
    );

    prismaMock.emailAutomation.findUnique.mockResolvedValue({
      id: "auto1",
      advertiserId: "adv1",
      status: "DRAFT",
      campaignId: null,
      listId: null,
      steps: [],
    });

    const result = await backfillAutomationForExistingContacts("auto1");

    expect(result).toEqual({ queuedSends: 0, contacts: 0 });
    expect(prismaMock.emailContact.findMany).not.toHaveBeenCalled();
  });

  it("returns zero when active automation has no campaign or list audience", async () => {
    const { backfillAutomationForExistingContacts } = await import(
      "@/modules/email-marketing/services/dispatch.service"
    );

    prismaMock.emailAutomation.findUnique.mockResolvedValue({
      id: "auto1",
      advertiserId: "adv1",
      status: "ACTIVE",
      campaignId: null,
      listId: null,
      steps: [{ id: "step1", type: "SEND_EMAIL", templateId: "tpl1", delayMinutes: 0 }],
    });

    const result = await backfillAutomationForExistingContacts("auto1");

    expect(result).toEqual({ queuedSends: 0, contacts: 0 });
    expect(prismaMock.emailContact.findMany).not.toHaveBeenCalled();
  });

  it("queues sends for list-based automation audiences", async () => {
    const { backfillAutomationForExistingContacts } = await import(
      "@/modules/email-marketing/services/dispatch.service"
    );

    prismaMock.emailAutomation.findUnique.mockResolvedValue({
      id: "auto1",
      advertiserId: "adv1",
      status: "ACTIVE",
      campaignId: null,
      listId: "list1",
      steps: [
        {
          id: "step1",
          type: "SEND_EMAIL",
          templateId: "tpl1",
          delayMinutes: 0,
        },
      ],
    });

    const listService = await import("@/modules/email-marketing/services/list.service");
    vi.spyOn(listService, "getListCampaignIds").mockResolvedValue(["camp1", "camp2"]);

    prismaMock.emailContact.findMany.mockResolvedValue([
      { id: "contact1", sourceLeadId: "lead1" },
    ]);

    prismaMock.emailSend.findFirst.mockResolvedValue(null);
    prismaMock.emailSend.create.mockResolvedValue({ id: "send1" });

    const result = await backfillAutomationForExistingContacts("auto1");

    expect(result).toEqual({ queuedSends: 1, contacts: 1 });
    expect(prismaMock.emailContact.findMany).toHaveBeenCalledWith({
      where: {
        advertiserId: "adv1",
        sourceCampaignId: { in: ["camp1", "camp2"] },
        status: "SUBSCRIBED",
      },
      select: { id: true, sourceLeadId: true },
    });
    expect(enqueueEmailSend).toHaveBeenCalledWith("send1", expect.any(Date));
  });

  it("does nothing when email marketing is disabled", async () => {
    const { backfillAutomationForExistingContacts } = await import(
      "@/modules/email-marketing/services/dispatch.service"
    );

    prismaMock.platformSetting.findUnique.mockResolvedValue({
      value: { enabled: false },
    });

    const result = await backfillAutomationForExistingContacts("auto1");

    expect(result).toEqual({ queuedSends: 0, contacts: 0 });
    expect(prismaMock.emailAutomation.findUnique).not.toHaveBeenCalled();
  });
});
