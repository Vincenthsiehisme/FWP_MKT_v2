export enum Gender {
  Male = '男',
  Female = '女',
  Other = '其他'
}

export interface WishItem {
  type: string;
  description: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  isTimeUnsure?: boolean;
  gender: Gender;
  wishes: WishItem[];
  createdAt: number;
}

export interface CrystalAnalysis {
  zodiacSign: string;
  element: string;
  bazi: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  fiveElements: {
    gold: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  };
  luckyElement: string;
  suggestedCrystals: string[];
  reasoning: string;
  visualDescription: string;
  colorPalette: string[];
}

export interface CartItem {
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  couponCode?: string;
  discountAmount: number;
  isCustomAnalysis?: boolean;
}

export interface ShippingDetails {
  realName: string;
  phone: string;
  storeCode: string;
  storeName: string;
  socialId: string;
  wristSize: string;
  purificationBagQty: number; 
  preferredColors: string[];
  
  items: CartItem[]; 
  totalPrice: number;
}

export interface GeneratedResult {
  imageUrl: string;
  analysis: CrystalAnalysis;
}

export interface CustomerRecord extends CustomerProfile {
  analysis?: CrystalAnalysis;
  generatedImageUrl?: string;
  shippingDetails?: ShippingDetails;
  wish?: string;
  isStandardProduct?: boolean;
}

export type LoadingState = 'idle' | 'analyzing' | 'generating_image' | 'completed' | 'error';

export interface PricingStrategy {
  type: 'standard' | 'custom';
  basePrice: number;
  shippingCost: number;
  sizeThreshold: number;
  surcharge: number;
}
