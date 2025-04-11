import { type ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { apiKeysFacade } from '../../facades/apiKeys';
import { aiServiceFacade } from '../../facades/aiService';
// productDataFacade is not used in this file
// import { productDataFacade } from '../../facades/productData';
import { FeedbackSchema } from '../../models/schemas';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Authenticate the request
  const session = await authenticate.admin(request);

  try {
    // Parse the request body
    const payload = await request.json();
    const { productId, previousContent, feedback, length, tone = 'professional' } = payload;

    if (!productId || !previousContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product ID and previous content are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate the feedback and length
    FeedbackSchema.parse({ feedback, length });

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

    // Build the previous content result structure
    const previousResult = {
      success: true,
      content: previousContent
    };

    // Regenerate content using the AI service
    const generationOptions = {
      length: parseInt(String(length), 10) || 250,
      tone: tone || 'professional',
    };

    const result = await aiServiceFacade.regenerateContent(
      session,
      previousResult,
      feedback,
      generationOptions
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Content regeneration failed'
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
    console.error('Error regenerating content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while regenerating content',
        errorCode: error.code || 'UNKNOWN_ERROR'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
