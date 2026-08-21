export interface Courier {
  id: string;
  name: string;
  logoUrl: string;
  isAvailable: boolean;
  baseFare: number;
  perKmCharge: number;
  platformFee: number;
  nightDifferentialEnabled: boolean;
  surchargeFee: number;
}

export interface DeliveryCharge {
  totalAmount: number;
  paymentOption: 'PAY_AT_CHECKOUT' | 'PAY_UPON_FULFILLMENT';
}
