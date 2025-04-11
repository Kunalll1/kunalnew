// app/utils/ai-providers/openai.ts

import OpenAI from 'openai';
import {
  ProductData,
  StoreContext,
  GenerationOptions,
  ContentGenerationResult,
  ProductContent
} from '../../models/types';

/**
 * OpenAI service provider implementation
 * Handles integration with the OpenAI API for content generation
 */
class OpenAIProvider {
  /**
   * Creates an instance of the OpenAI API client
   * @param apiKey - The OpenAI API key
   * @returns An instance of the OpenAI API client
   */
  private createClient(apiKey: string): OpenAI {
    return new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Generates product content based on product data, prompt, and preferences
   * @param apiKey - The OpenAI API key
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
      const openai = this.createClient(apiKey);

      // Construct the prompt
      const prompt = this.buildProductPrompt(productData, customPrompt, options);

      // Make the API request to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
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
      const rawContent = response.choices[0].message?.content || '';

      // Extract the structured content (title, description, etc.)
      const content = this.parseGeneratedContent(rawContent);

      return {
        success: true,
        content,
        metadata: {
          model: 'gpt-4',
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        }
      };
    } catch (error: any) {
      console.error('OpenAI generation error:', error);

      // Handle specific OpenAI errors
      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          return {
            success: false,
            error: 'Invalid API key. Please check your OpenAI API key in the settings.',
            errorCode: 'INVALID_API_KEY'
          };
        } else if (status === 429) {
          return {
            success: false,
            error: 'OpenAI rate limit exceeded. Please try again later.',
            errorCode: 'RATE_LIMIT_EXCEEDED'
          };
        }
      }

      return {
        success: false,
        error: error.message || 'An error occurred while generating content with OpenAI.',
        errorCode: 'OPENAI_ERROR'
      };
    }
  }

  /**
   * Regenerates content based on feedback
   * @param apiKey - The OpenAI API key
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

      const openai = this.createClient(apiKey);

      // Construct the prompt for regeneration
      const prompt = this.buildRegenerationPrompt(previousResult.content, feedback, options);

      // Make the API request to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
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
      const rawContent = response.choices[0].message?.content || '';

      // Extract the structured content (title, description, etc.)
      const content = this.parseGeneratedContent(rawContent);

      return {
        success: true,
        content,
        metadata: {
          model: 'gpt-4',
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        }
      };
    } catch (error: any) {
      console.error('OpenAI regeneration error:', error);

      return {
        success: false,
        error: error.message || 'An error occurred while regenerating content with OpenAI.',
        errorCode: 'OPENAI_REGENERATION_ERROR'
      };
    }
  }

  /**
   * Generates content from an image
   * @param apiKey - The OpenAI API key
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
      const openai = this.createClient(apiKey);

      // Construct the prompt for image-based generation
      const prompt = this.buildImagePrompt(imageUrl, storeContext, customPrompt, options);

      // Make the API request to OpenAI with GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional e-commerce content writer that specializes in creating compelling product descriptions based on images.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      // Parse the response
      const rawContent = response.choices[0].message?.content || '';

      // Extract the structured content (title, description, etc.)
      const content = this.parseGeneratedContent(rawContent);

      return {
        success: true,
        content,
        metadata: {
          model: 'gpt-4-vision-preview',
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        }
      };
    } catch (error: any) {
      console.error('OpenAI image generation error:', error);

      // Handle specific OpenAI errors
      if (error.response) {
        const status = error.response.status;

        if (status === 400) {
          return {
            success: false,
            error: 'Invalid image format or URL. Please provide a valid image.',
            errorCode: 'INVALID_IMAGE'
          };
        }
      }

      return {
        success: false,
        error: error.message || 'An error occurred while generating content from image with OpenAI.',
        errorCode: 'OPENAI_IMAGE_ERROR'
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
 * Singleton instance of the OpenAI provider
 */
export const openaiProvider = new OpenAIProvider();