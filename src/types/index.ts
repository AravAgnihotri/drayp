// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserMeasurements {
  height: number;    // cm
  weight: number;    // kg
  chest: number;     // cm
  waist: number;     // cm
  hips: number;      // cm
  inseam: number;    // cm
  shoeSize: number;  // US size
}

export interface StylePreferences {
  favoriteColors: string[];
  favoriteBrands: string[];
  styles: StyleTag[];
  priceMin: number;
  priceMax: number;
}

export type StyleTag =
  | 'casual'
  | 'formal'
  | 'streetwear'
  | 'minimalist'
  | 'athletic'
  | 'preppy'
  | 'workwear'
  | 'bohemian'
  | 'luxury';

export interface UserProfile {
  name: string;
  email?: string;
  photoUrl?: string;
  gender?: 'mens' | 'womens' | 'nonbinary';
  measurements: Partial<UserMeasurements>;
  stylePreferences: Partial<StylePreferences>;
  createdAt: string;
  updatedAt: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export type ProductCategory = 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories';

// ─── Shopping Intent ──────────────────────────────────────────────────────────

export interface ShoppingIntent {
  /** True when the user is only greeting, thanking, or small talk — skip product search. */
  conversationOnly?: boolean;
  /**
   * True when the query is too vague to return useful results — missing budget,
   * occasion, or fit preference. The agent will ask clarifyingQuestion instead of searching.
   */
  needsClarification?: boolean;
  /** One or two focused questions to ask the user before searching. */
  clarifyingQuestion?: string;
  category?: ProductCategory;
  subcategories?: string[];
  colors?: string[];
  styles?: StyleTag[];
  maxPrice?: number;
  minPrice?: number;
  occasion?: string;
  brands?: string[];
  keywords?: string[];
  rawQuery: string;
}

// ─── Shopping Results (Serper) ────────────────────────────────────────────────

export interface ShoppingResult {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  source: string;
  link: string;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  fitScore?: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  shoppingResults?: ShoppingResult[];
  intent?: ShoppingIntent;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  message: string;
  shoppingResults?: ShoppingResult[];
  intent?: ShoppingIntent;
}
