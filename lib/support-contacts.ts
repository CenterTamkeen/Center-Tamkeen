export type SupportContact = {
  label: string;
  phone: string;
  whatsappNumber: string;
};

export const supportContacts: SupportContact[] = [
  {
    label: "دعم تمكين ١",
    phone: "01149273700",
    whatsappNumber: "201149273700",
  },
  {
    label: "دعم تمكين ٢",
    phone: "01125683408",
    whatsappNumber: "201125683408",
  },
  {
    label: "دعم تمكين ٣",
    phone: "01018022257",
    whatsappNumber: "201018022257",
  },
  {
    label: "دعم تمكين ٤",
    phone: "01111901562",
    whatsappNumber: "201111901562",
  },
  {
    label: "دعم تمكين ٥",
    phone: "01110940360",
    whatsappNumber: "201110940360",
  },
];

export function buildWhatsappHref(contact: SupportContact, message?: string) {
  const params = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${contact.whatsappNumber}${params}`;
}
