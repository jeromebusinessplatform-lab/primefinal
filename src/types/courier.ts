export interface Courier {
  id: string;
  name: string;
  type: 'Standard' | 'Express' | 'Priority';
  logoUrl: string;
  isAvailable: boolean;
  baseFare: number;
  minFare: number;
  minDistanceInclusions: number; // in KM
  perKmCharge: number;
  platformFee: number;
  nightDifferentialEnabled: boolean;
  surchargeFee: number;
}

export interface DeliveryCharge {
  totalAmount: number;
  paymentOption: 'PAY_AT_CHECKOUT' | 'PAY_UPON_FULFILLMENT';
}
