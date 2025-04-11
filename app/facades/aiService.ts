
/**
 * AiServiceFacade provides a simple interface for generating content using AI services.
 * It abstracts away the complexity of different AI providers and their APIs.
 */
export interface AiServiceFacade {
    /**
     * Generates product content based on product data, prompt, and preferences
     * @param session - The authenticated session
     * @param productData - Information about the product
     * @param customPrompt - User-provided custom prompt
     * @param options - Generation options (length, etc.)
     * @returns The generated content or an error
     */
    generateProductContent(
      session: any,
      productData: ProductData,
      customPrompt: string,
      options: GenerationOptions
    ): Promise<ContentGenerationResult>;
    
    /**
     * Regenerates content based on feedback
     * @param session - The authenticated session
     * @param previousResult - The previous generation result
     * @param feedback - User feedback for improvement
     * @param options - Updated generation options
     * @returns The regenerated content or an error
     */
    regenerateContent(
      session: any,
      previousResult: ContentGenerationResult,
      feedback: string,
      options: GenerationOptions
    ): Promise<ContentGenerationResult>;
    
    /**
     * Generates content from an image
     * @param session - The authenticated session
     * @param imageUrl - The image URL
     * @param storeContext - Information about the store
     * @param customPrompt - User-provided custom prompt
     * @param options - Generation options
     * @returns The generated content or an error
     */
    generateFromImage(
      session: any,
      imageUrl: string,
      storeContext: StoreContext,
      customPrompt: string,
      options: GenerationOptions
    ): Promise<ContentGenerationResult>;
  }
  
  // Import dependencies and types
  import { apiKeysFacade } from './apiKeys';
  import { 
    ProductData, 
    StoreContext, 
    GenerationOptions, 
    ContentGenerationResult 
  } from '../models/types';
  import { openaiProvider } from '../utils/ai-providers/openai';
  import { deepseekProvider } from '../utils/ai-providers/deepseek';
  
  /**
   * Implementation of the AI Service Facade
   * This selects the appropriate AI provider based on the user's settings
   */
  class AiServiceImplementation implements AiServiceFacade {
    private getProvider(provider: string) {
      switch (provider.toLowerCase()) {
        case 'openaiApiKey':
          return openaiProvider;
        case 'deepseekApiKey':
          return deepseekProvider;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    }
    
    async generateProductContent(
      session: any,
      productData: ProductData,
      customPrompt: string,
      options: GenerationOptions
    ): Promise<ContentGenerationResult> {
      try {
        // Get the API key and provider
        const apiKeyData = await apiKeysFacade.getApiKey(session);
        
        if (!apiKeyData) {
          return {
            success: false,
            error: 'No API key configured. Please configure an API key in the settings.',
            errorCode: 'NO_API_KEY'
          };
        }
        
        // Get the appropriate provider
        const provider = this.getProvider(apiKeyData.provider);
        
        // Generate the content
        return await provider.generateProductContent(
          apiKeyData.apiKey,
          productData,
          customPrompt,
          options
        );
      } catch (error) {
        console.error('Error generating product content:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'GENERATION_FAILED'
        };
      }
    }
    
    async regenerateContent(
      session: any,
      previousResult: ContentGenerationResult,
      feedback: string,
      options: GenerationOptions
    ): Promise<ContentGenerationResult> {
      try {
        // Get the API key and provider
        const apiKeyData = await apiKeysFacade.getApiKey(session);
        
        if (!apiKeyData) {
          return {
            success: false,
            error: 'No API key configured. Please configure an API key in the settings.',
            errorCode: 'NO_API_KEY'
          };
        }
        
        // Get the appropriate provider
        const provider = this.getProvider(apiKeyData.provider);
        
        // Regenerate the content
        return await provider.regenerateContent(
          apiKeyData.apiKey,
          previousResult,
          feedback,
          options
        );
      } catch (error) {
        console.error('Error regenerating content:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'REGENERATION_FAILED'
        };
      }
    }
    
    async generateFromImage(
      session: any,
      imageUrl: string,
      storeContext: StoreContext,
      customPrompt: string,
      options: GenerationOptions
    ): Promise<ContentGenerationResult> {
      try {
        // Get the API key and provider
        const apiKeyData = await apiKeysFacade.getApiKey(session);
        
        if (!apiKeyData) {
          return {
            success: false,
            error: 'No API key configured. Please configure an API key in the settings.',
            errorCode: 'NO_API_KEY'
          };
        }
        
        // Get the appropriate provider
        const provider = this.getProvider(apiKeyData.provider);
        
        // Check if the provider supports image-based generation
        if (!provider.generateFromImage) {
          return {
            success: false,
            error: `The ${apiKeyData.provider} provider does not support image-based generation.`,
            errorCode: 'UNSUPPORTED_FEATURE'
          };
        }
        
        // Generate the content from the image
        return await provider.generateFromImage(
          apiKeyData.apiKey,
          imageUrl,
          storeContext,
          customPrompt,
          options
        );
      } catch (error) {
        console.error('Error generating content from image:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'IMAGE_GENERATION_FAILED'
        };
      }
    }
  }
  
  /**
   * Default implementation of the AiServiceFacade
   * This exports a singleton instance of the facade for use throughout the app
   */
  export const aiServiceFacade: AiServiceFacade = new AiServiceImplementation();