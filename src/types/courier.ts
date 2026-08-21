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
  platformFeeEnabled: boolean;
  platformFee: number;
  nightDifferentialEnabled: boolean;
  nightDifferentialFee: number;
  surchargeEnabled: boolean;
  surchargeFee: number;
}

export interface DeliveryCharge {
  totalAmount: number;
  paymentOption: 'PAY_AT_CHECKOUT' | 'PAY_UPON_FULFILLMENT';
}
