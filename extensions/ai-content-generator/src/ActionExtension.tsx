import { useEffect, useState } from 'react';
import {
  reactExtension,
  useApi,
  Text,
  Button,
  BlockStack,
  InlineStack,
  AdminAction,
  TextField,
  Banner,
  Box,
  Divider,
} from '@shopify/ui-extensions-react/admin';

// Target matches what's in your shopify.extension.toml file
const TARGET = 'admin.product-details.action.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  const { close, data } = useApi(TARGET);

  // State management
  const [productData, setProductData] = useState(null);
  const [contentLength, setContentLength] = useState(250); // Default length
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch product data when extension loads
  useEffect(() => {
    async function fetchProductData() {
      try {
        const getProductQuery = {
          query: `query Product($id: ID!) {
            product(id: $id) {
              id
              title
              description
              descriptionHtml
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
            }
          }`,
          variables: { id: data.selected[0].id },
        };

        const res = await fetch("shopify:admin/api/graphql.json", {
          method: "POST",
          body: JSON.stringify(getProductQuery),
        });

        if (!res.ok) {
          throw new Error('Network error');
        }

        const responseData = await res.json();
        setProductData(responseData.data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product data');
      }
    }

    if (data.selected && data.selected.length > 0) {
      fetchProductData();
    }
  }, [data.selected]);

  // Generate content
  async function handleGenerateContent() {
    try {
      setGeneratingContent(true);
      setError(null);

      // Get the absolute URL to your app (this is needed since the extension runs in Shopify admin)
      // You'll need to replace this with your actual app URL in production
      const appUrl = 'https://speed-ca-games-mailed.trycloudflare.com';

      // Call our app's generate content endpoint
      const response = await fetch(`${appUrl}/api/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include any auth headers needed
        },
        body: JSON.stringify({
          productId: data.selected[0].id,
          length: contentLength,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const result = await response.json();
      setGeneratedContent(result.content);
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setGeneratingContent(false);
    }
  }

  // Regenerate content with feedback
  async function handleRegenerateContent() {
    try {
      setGeneratingContent(true);
      setError(null);

      const appUrl = 'https://speed-ca-games-mailed.trycloudflare.com';

      const response = await fetch(`${appUrl}/api/regenerate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: data.selected[0].id,
          previousContent: generatedContent,
          feedback: feedback,
          length: contentLength,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate content');
      }

      const result = await response.json();
      setGeneratedContent(result.content);
      setFeedback(''); // Clear feedback after regeneration
    } catch (error) {
      console.error('Error regenerating content:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setGeneratingContent(false);
    }
  }

  // Apply generated content to product
  async function handleApplyContent() {
    try {
      setError(null);

      // Update the product using GraphQL
      const updateMutation = {
        query: `mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          input: {
            id: data.selected[0].id,
            title: generatedContent.title,
            descriptionHtml: generatedContent.description,
            // Add SEO fields if necessary
          }
        }
      };

      const response = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify(updateMutation),
      });

      const result = await response.json();

      if (result.data?.productUpdate?.userErrors?.length > 0) {
        throw new Error(result.data.productUpdate.userErrors[0].message);
      }

      setSuccess(true);

      // Auto-close after showing success message
      setTimeout(() => {
        close();
      }, 2000);
    } catch (error) {
      console.error('Error applying content:', error);
      setError(error.message || 'Failed to apply content to product');
    } finally {
      // Content applied successfully
    }
  }

  // Loading state
  if (!productData) {
    return (
      <AdminAction title="Generate Product Content">
        <BlockStack>
          <Text>Loading product information...</Text>
        </BlockStack>
      </AdminAction>
    );
  }

  // Success state
  if (success) {
    return (
      <AdminAction title="Success">
        <Banner tone="success">
          Content successfully applied to product!
        </Banner>
      </AdminAction>
    );
  }

  // Error state component
  const errorBanner = error ? (
    <Banner tone="critical">{error}</Banner>
  ) : null;

  // Main UI
  return (
    <AdminAction
      title="Generate Product Content"
      primaryAction={
        generatedContent ? (
          <Button onPress={handleApplyContent}>
            Apply to Product
          </Button>
        ) : (
          <Button onPress={handleGenerateContent}>
            Generate Content
          </Button>
        )
      }
      secondaryAction={
        <Button onPress={() => close()}>
          Cancel
        </Button>
      }
    >
      <BlockStack>
        {errorBanner}

        {/* Product info */}
        <Box>
          <BlockStack>
            <Text fontWeight="bold">{productData.title}</Text>
            {productData.description ? (
              <Text>{productData.description}</Text>
            ) : (
              <Text>No description</Text>
            )}
          </BlockStack>
        </Box>

        {/* Generation options */}
        {!generatedContent && (
          <BlockStack>
            <Text fontWeight="bold">Content Length</Text>
            <BlockStack>
              <InlineStack>
                <Text>100 words</Text>
                <Text>500 words</Text>
              </InlineStack>
              <input
                type="range"
                min="100"
                max="500"
                step="50"
                value={contentLength}
                onChange={(e) => setContentLength(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
              <Text>{contentLength} words</Text>
            </BlockStack>
          </BlockStack>
        )}

        {/* Loading state */}
        {generatingContent && (
          <BlockStack>
            <Text>Generating content...</Text>
          </BlockStack>
        )}

        {/* Generated content display */}
        {generatedContent && !generatingContent && (
          <BlockStack>
            <Divider />

            <BlockStack>
              <Text fontWeight="bold">Generated Title</Text>
              <Text>{generatedContent.title}</Text>
            </BlockStack>

            <BlockStack>
              <Text fontWeight="bold">Generated Description</Text>
              <Text>{generatedContent.description}</Text>
            </BlockStack>

            <Divider />

            {/* Feedback for regeneration */}
            <BlockStack>
              <Text fontWeight="bold">Not satisfied? Provide feedback to regenerate</Text>
              <TextField
                label="Feedback"
                value={feedback}
                onChange={setFeedback}
                placeholder="What would you like to change?"
              />
              <Button
                onPress={handleRegenerateContent}
                disabled={!feedback.trim()}
              >
                Regenerate with Feedback
              </Button>
            </BlockStack>
          </BlockStack>
        )}
      </BlockStack>
    </AdminAction>
  );
}
