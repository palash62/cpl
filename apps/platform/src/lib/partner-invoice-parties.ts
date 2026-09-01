export type PartnerInvoicePartyPayer = {
  company: string;
  domain: string;
  email: string;
  name: string;
  phone: string;
};

export type PartnerInvoicePartyPayee = {
  name: string;
  email: string;
  phone: string;
};

export type PartnerInvoiceParties = {
  payer: PartnerInvoicePartyPayer;
  payee: PartnerInvoicePartyPayee;
};

export function getPartnerInvoiceParties(): PartnerInvoiceParties {
  return {
    payer: {
      company: process.env.PARTNER_INVOICE_PAYER_COMPANY?.trim() || "Leadvix",
      domain: process.env.PARTNER_INVOICE_PAYER_DOMAIN?.trim() || "leadvix.io",
      email: process.env.PARTNER_INVOICE_PAYER_EMAIL?.trim() || "affsensellc@gmail.com",
      name: process.env.PARTNER_INVOICE_PAYER_NAME?.trim() || "Yuvral Lusthe",
      phone: process.env.PARTNER_INVOICE_PAYER_PHONE?.trim() || "+91 9967874946",
    },
    payee: {
      name: process.env.PARTNER_INVOICE_PAYEE_NAME?.trim() || "Palash Paul",
      email: process.env.PARTNER_INVOICE_PAYEE_EMAIL?.trim() || "ppalash62@gmail.com",
      phone: process.env.PARTNER_INVOICE_PAYEE_PHONE?.trim() || "+91 8013702840",
    },
  };
}

export function invoiceNumberForPeriod(periodMonth: string): string {
  return `INV-${periodMonth}`;
}
