
/**
 * Product data retrieved from Shopify
 */
export interface ProductData {
    id: string;
    title: string;
    description: string;
    images: {
      id: string;
      url: string;
      altText: string | null;
    }[];
    metafields: {
      namespace: string;
      key: string;
      value: string;
    }[];
  }
  
  /**
   * Store context information
   */
  export interface StoreContext {
    id: string;
    name: string;
    description: string;
    domain: string;
    email: string;
  }
  
  /**
   * Options for content generation
   */
  export interface GenerationOptions {
    length: number; // Word count between 100-500
    tone?: 'professional' | 'casual' | 'enthusiastic';
    includeKeywords?: string[];
  }
  
  /**
   * Generated product content
   */
  export interface ProductContent {
    title: string;
    description: string;
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  }
  
  /**
   * Result of content generation
   */
  export interface ContentGenerationResult {
    success: boolean;
    content?: ProductContent;
    error?: string;
    errorCode?: string;
    metadata?: {
      model: string;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  }
  
  /**
   * Settings for the app
   */
  export interface AppSettings {
    apiProvider: 'openaiApiKey' | 'deepseekApiKey';
    customPrompt: string;
    defaultLength: number;
  }