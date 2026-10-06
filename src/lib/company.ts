export const COMPANY_REGISTERED = true;

export const COMPANY: {
  name: string;
  companyNumber: string;
  vatNumber: string;
  vatRegistered: boolean;
  addressLine: string;
  country: string;
  registeredOffice: string;
  phone: string | null;
  email: string;
  supportHours: string;
} = {
  name: "COMPANY NAME",
  companyNumber: "[REG_NUMBER]",
  vatNumber: "[VAT_NUMBER]",
  vatRegistered: false,
  addressLine: "[COMPANY ADDRESS]",
  country: "[COUNTRY]",
  registeredOffice: "[COMPANY ADDRESS]",
  phone: null,
  email: "youremail@example.com",
  supportHours: "Mon–Fri, 09:00–18:00 (GMT)",
};
