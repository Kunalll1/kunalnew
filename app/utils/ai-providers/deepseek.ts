// app/utils/ai-providers/deepseek.ts

import axios from 'axios';
import {
  ProductData,
  StoreContext,
  GenerationOptions,
  ContentGenerationResult,
  ProductContent
} from '../../models/types';

/**
 * DeepSeek API provider implementation
 * Handles integration with the DeepSeek API for content generation
 *
 * Note: This implementation is based on typical LLM API patterns
 * and may need adjustments based on DeepSeek's actual API documentation
 */
class DeepSeekProvider {
  // DeepSeek API base URL
  private readonly apiBaseUrl = 'https://api.deepseek.ai/v1';

  /**
   * Creates an instance of the DeepSeek API client
   * @param apiKey - The DeepSeek API key
   * @returns An axios instance configured for DeepSeek API
   */
  private createClient(apiKey: string) {
    return axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generates product content based on product data, prompt, and preferences
   * @param apiKey - The DeepSeek API key
   * @param productData - Information about the product
   * @param customPrompt - User-provided custom prompt
   * @param options - Generation options (length, etc.)
   * @returns Promise resolving to the generation result
   */
  async generateProductContent(
    apiKey: string,
    productData: ProductData,
    customPrompt: string,
    options: GenerationOptions
  ): Promise<ContentGenerationResult> {
    try {
      const client = this.createClient(apiKey);

      // Construct the prompt
      const prompt = this.buildProductPrompt(productData, customPrompt, options);

      // Make the API request to DeepSeek
      const response = await client.post('/chat/completions', {
        model: 'deepseek-coder-v2', // Using DeepSeek's latest model
        messages: [
          {
            role: 'system',
            content: 'You are a professional e-commerce content writer that specializes in creating compelling product descriptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      // Parse the response
      // Note: Adjust according to DeepSeek's actual response structure
      const rawContent = response.data.choices[0].message?.content || '';

      // Extract the structured content (title, description, etc.)
      const content = this.parseGeneratedContent(rawContent);

      return {
        success: true,
        content,
        metadata: {
          model: 'deepseek-coder-v2',
          promptTokens: response.data.usage?.prompt_tokens,
          completionTokens: response.data.usage?.completion_tokens,
          totalTokens: response.data.usage?.total_tokens,
        }
      };
    } catch (error: any) {
      console.error('DeepSeek generation error:', error);

      // Handle specific DeepSeek errors
      // Note: Adjust error handling based on DeepSeek's error response structure
      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          return {
            success: false,
            error: 'Invalid API key. Please check your DeepSeek API key in the settings.',
            errorCode: 'INVALID_API_KEY'
          };
        } else if (status === 429) {
          return {
            success: false,
            error: 'DeepSeek rate limit exceeded. Please try again later.',
            errorCode: 'RATE_LIMIT_EXCEEDED'
          };
        }
      }

      return {
        success: false,
        error: error.message || 'An error occurred while generating content with DeepSeek.',
        errorCode: 'DEEPSEEK_ERROR'
      };
    }
  }

  /**
   * Regenerates content based on feedback
   * @param apiKey - The DeepSeek API key
   * @param previousResult - The previous generation result
   * @param feedback - User feedback for improvement
   * @param options - Updated generation options
   * @returns Promise resolving to the regeneration result
   */
  async regenerateContent(
    apiKey: string,
    previousResult: ContentGenerationResult,
    feedback: string,
    options: GenerationOptions
  ): Promise<ContentGenerationResult> {
    try {
      if (!previousResult.success || !previousResult.content) {
        return {
          success: false,
          error: 'No previous content to regenerate',
          errorCode: 'NO_PREVIOUS_CONTENT'
        };
      }

      const client = this.createClient(apiKey);

      // Construct the prompt for regeneration
      const prompt = this.buildRegenerationPrompt(previousResult.content, feedback, options);

      // Make the API request to DeepSeek
      const response = await client.post('/chat/completions', {
        model: 'deepseek-coder-v2', // Using DeepSeek's latest model
        messages: [
          {
            role: 'system',
            content: 'You are a professional e-commerce content writer that specializes in creating compelling product descriptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      // Parse the response
      // Note: Adjust according to DeepSeek's actual response structure
      const rawContent = response.data.choices[0].message?.content || '';

      // Extract the structured content (title, description, etc.)
      const content = this.parseGeneratedContent(rawContent);

      return {
        success: true,
        content,
        metadata: {
          model: 'deepseek-coder-v2',
          promptTokens: response.data.usage?.prompt_tokens,
          completionTokens: response.data.usage?.completion_tokens,
          totalTokens: response.data.usage?.total_tokens,
        }
      };
    } catch (error: any) {
      console.error('DeepSeek regeneration error:', error);

      return {
        success: false,
        error: error.message || 'An error occurred while regenerating content with DeepSeek.',
        errorCode: 'DEEPSEEK_REGENERATION_ERROR'
      };
    }
  }

  /**
   * Generates content from an image
   * @param apiKey - The DeepSeek API key
   * @param imageUrl - The image URL
   * @param storeContext - Information about the store
   * @param customPrompt - User-provided custom prompt
   * @param options - Generation options
   * @returns Promise resolving to the generation result
   */
  async generateFromImage(
    apiKey: string,
    imageUrl: string,
    storeContext: StoreContext,
    customPrompt: string,
    options: GenerationOptions
  ): Promise<ContentGenerationResult> {
    try {
      const client = this.createClient(apiKey);

      // Construct the prompt for image-based generation
      const prompt = this.buildImagePrompt(imageUrl, storeContext, customPrompt, options);

      // DeepSeek doesn't currently support vision models like OpenAI does
      // Return a feature not supported error
      return {
        success: false,
        error: 'Image-based generation is not currently supported by DeepSeek. Please use OpenAI for this feature.',
        errorCode: 'FEATURE_NOT_SUPPORTED'
      };
    } catch (error: any) {
      console.error('DeepSeek image generation error:', error);

      // Check if this is a "feature not supported" error
      if (error.response && error.response.status === 400) {
        return {
          success: false,
          error: 'Image-based generation is not currently supported by DeepSeek. Please use OpenAI for this feature.',
          errorCode: 'FEATURE_NOT_SUPPORTED'
        };
      }

      return {
        success: false,
        error: error.message || 'An error occurred while generating content from image with DeepSeek.',
        errorCode: 'DEEPSEEK_IMAGE_ERROR'
      };
    }
  }

  /**
   * Builds a prompt for product content generation
   * @param productData - Information about the product
   * @param customPrompt - User-provided custom prompt
   * @param options - Generation options
   * @returns The constructed prompt
   */
  private buildProductPrompt(
    productData: ProductData,
    customPrompt: string,
    options: GenerationOptions
  ): string {
    // Extract product information
    const { title, description, images } = productData;

    // Determine the tone from options
    const tone = options.tone || 'professional';

    // Build the prompt
    return `
      Generate SEO-optimized product content for an e-commerce store. The content should be ${options.length} words long and have a ${tone} tone.

      Product Information:
      - Current Title: ${title}
      - Current Description: ${description || 'None provided'}
      - Number of Images: ${images.length}

      ${options.includeKeywords?.length ? `Keywords to include: ${options.includeKeywords.join(', ')}` : ''}

      Custom Instructions: ${customPrompt}

      Please provide the following in your response:

      # TITLE
      [Generate a compelling product title]

      # DESCRIPTION
      [Generate a detailed product description]

      # SEO_TITLE
      [Generate an SEO-optimized title tag]

      # SEO_DESCRIPTION
      [Generate an SEO-optimized meta description]

      # KEYWORDS
      [Generate a comma-separated list of relevant keywords]
    `;
  }

  /**
   * Builds a prompt for content regeneration
   * @param previousContent - The previously generated content
   * @param feedback - User feedback for improvement
   * @param options - Updated generation options
   * @returns The constructed prompt
   */
  private buildRegenerationPrompt(
    previousContent: ProductContent,
    feedback: string,
    options: GenerationOptions
  ): string {
    // Determine the tone from options
    const tone = options.tone || 'professional';

    // Build the prompt
    return `
      I previously generated the following product content:

      # TITLE
      ${previousContent.title}

      # DESCRIPTION
      ${previousContent.description}

      # SEO_TITLE
      ${previousContent.seoTitle || 'None generated'}

      # SEO_DESCRIPTION
      ${previousContent.seoDescription || 'None generated'}

      # KEYWORDS
      ${previousContent.keywords?.join(', ') || 'None generated'}

      Please revise this content based on the following feedback:
      ${feedback}

      The revised content should be approximately ${options.length} words long and have a ${tone} tone.

      ${options.includeKeywords?.length ? `Keywords to include: ${options.includeKeywords.join(', ')}` : ''}

      Please provide the revised content in the same format:

      # TITLE
      [Revised title]

      # DESCRIPTION
      [Revised description]

      # SEO_TITLE
      [Revised SEO title]

      # SEO_DESCRIPTION
      [Revised SEO description]

      # KEYWORDS
      [Revised keywords]
    `;
  }

  /**
   * Builds a prompt for image-based content generation
   * @param imageUrl - The image URL
   * @param storeContext - Information about the store
   * @param customPrompt - User-provided custom prompt
   * @param options - Generation options
   * @returns The constructed prompt
   */
  private buildImagePrompt(
    imageUrl: string,
    storeContext: StoreContext,
    customPrompt: string,
    options: GenerationOptions
  ): string {
    // Extract store information
    const { name, description } = storeContext;

    // Determine the tone from options
    const tone = options.tone || 'professional';

    // Build the prompt
    return `
      I'm sharing an image of a product from our store "${name}" (${description || 'No store description available'}).

      Please analyze this image and generate SEO-optimized product content. The content should be ${options.length} words long and have a ${tone} tone.

      ${options.includeKeywords?.length ? `Keywords to include: ${options.includeKeywords.join(', ')}` : ''}

      Custom Instructions: ${customPrompt}

      Based solely on what you can see in this image, please provide the following:

      # TITLE
      [Generate a compelling product title based on the image]

      # DESCRIPTION
      [Generate a detailed product description based on the image]

      # SEO_TITLE
      [Generate an SEO-optimized title tag]

      # SEO_DESCRIPTION
      [Generate an SEO-optimized meta description]

      # KEYWORDS
      [Generate a comma-separated list of relevant keywords]
    `;
  }

  /**
   * Parses the raw content generated by the AI into structured fields
   * @param rawContent - The raw content from the AI
   * @returns The structured product content
   */
  private parseGeneratedContent(rawContent: string): ProductContent {
    // Default content
    const content: ProductContent = {
      title: '',
      description: '',
    };

    // Extract title
    const titleMatch = rawContent.match(/# TITLE\s*\n([\s\S]*?)(?=\n# |$)/);
    if (titleMatch && titleMatch[1]) {
      content.title = titleMatch[1].trim();
    }

    // Extract description
    const descriptionMatch = rawContent.match(/# DESCRIPTION\s*\n([\s\S]*?)(?=\n# |$)/);
    if (descriptionMatch && descriptionMatch[1]) {
      content.description = descriptionMatch[1].trim();
    }

    // Extract SEO title
    const seoTitleMatch = rawContent.match(/# SEO_TITLE\s*\n([\s\S]*?)(?=\n# |$)/);
    if (seoTitleMatch && seoTitleMatch[1]) {
      content.seoTitle = seoTitleMatch[1].trim();
    }

    // Extract SEO description
    const seoDescriptionMatch = rawContent.match(/# SEO_DESCRIPTION\s*\n([\s\S]*?)(?=\n# |$)/);
    if (seoDescriptionMatch && seoDescriptionMatch[1]) {
      content.seoDescription = seoDescriptionMatch[1].trim();
    }

    // Extract keywords
    const keywordsMatch = rawContent.match(/# KEYWORDS\s*\n([\s\S]*?)(?=\n# |$)/);
    if (keywordsMatch && keywordsMatch[1]) {
      content.keywords = keywordsMatch[1]
        .trim()
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
    }

    return content;
  }
}

/**
 * Singleton instance of the DeepSeek provider
 */
export const deepseekProvider = new DeepSeekProvider();