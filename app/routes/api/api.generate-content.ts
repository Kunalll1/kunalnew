import { type ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { apiKeysFacade } from '~/facades/apiKeys';
import { aiServiceFacade } from '~/facades/aiService';
import { productDataFacade } from '~/facades/productData';
import { metafieldsFacade } from '~/facades/metafields';
import { GenerationOptionsSchema } from '~/models/schemas';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Authenticate the request
  const session = await authenticate.admin(request);

  try {
    // Parse the request body
    const payload = await request.json();
    const { productId, length, tone = 'professional' } = payload;

    if (!productId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate the length
    GenerationOptionsSchema.parse({ length });

    // Get the API key from metafields
    const apiKeyData = await apiKeysFacade.getApiKey(session);

    if (!apiKeyData || !apiKeyData.apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No API key configured. Please configure an API key in the settings.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the custom prompt from metafields
    const customPrompt = await metafieldsFacade.getMetafield(
      session,
      'apiservice',
      'custom_prompt'
    ) || '';

    // Get product data
    const productData = await productDataFacade.getProductById(session, productId);

    // Get store context (not used in this function but might be useful for future enhancements)
    // const storeContext = await productDataFacade.getStoreContext(session);

    // Generate content using the AI service
    const generationOptions = {
      length: parseInt(String(length), 10) || 250,
      tone: tone || 'professional',
    };

    const result = await aiServiceFacade.generateProductContent(
      session,
      productData,
      customPrompt,
      generationOptions
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Content generation failed'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: result.content
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while generating content',
        errorCode: error.code || 'UNKNOWN_ERROR'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
