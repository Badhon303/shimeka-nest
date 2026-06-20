// Brand + business constants shared across apps.

export const BRAND = {
  name: "Shimeka",
  tagline: "Beauty & Style, Delivered.",
  supportPhone: "+880 1XXX-XXXXXX",
  supportEmail: "support@shimeka.com",
};

// Shipping fees (BDT) per the brief.
export const SHIPPING = {
  insideDhaka: 60,
  outsideDhaka: 100,
  // Optional free-shipping threshold (set 0 to disable).
  freeShippingThreshold: 0,
};

export const SHIPPING_ZONES = [
  { id: "inside_dhaka", label: "Inside Dhaka", fee: SHIPPING.insideDhaka },
  { id: "outside_dhaka", label: "Outside Dhaka", fee: SHIPPING.outsideDhaka },
] as const;

export type ShippingZoneId = (typeof SHIPPING_ZONES)[number]["id"];

// Static payment instructions displayed at checkout (no real processing in phase 1).
export const PAYMENT_INSTRUCTIONS = {
  COD: {
    label: "Cash on Delivery",
    description: "Pay with cash when your order is delivered.",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    description:
      "Transfer the total amount to our bank account and we will confirm your payment.",
    details: [
      { label: "Bank", value: "Example Bank Ltd." },
      { label: "Account Name", value: "Shimeka" },
      { label: "Account Number", value: "0000-0000-0000" },
      { label: "Branch", value: "Dhaka" },
    ],
  },
  MOBILE_BANKING: {
    label: "Mobile Banking (bKash / Nagad)",
    description:
      "Send money to one of the numbers below (Personal) and keep the TrxID for confirmation.",
    details: [
      { label: "bKash", value: "01XXXXXXXXX" },
      { label: "Nagad", value: "01XXXXXXXXX" },
    ],
  },
} as const;

export const API_PREFIX = "/api/v1";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
