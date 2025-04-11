
/**
 * ProductDataFacade provides a simple interface for retrieving product data from Shopify.
 * It abstracts away the complexity of the Shopify API.
 */
export interface ProductDataFacade {
    /**
     * Gets product data by ID
     * @param session - The authenticated session
     * @param productId - The Shopify product ID
     * @returns The product data
     */
    getProductById(session: any, productId: string): Promise<ProductData>;

    /**
     * Gets store context information
     * @param session - The authenticated session
     * @returns The store context
     */
    getStoreContext(session: any): Promise<StoreContext>;

    /**
     * Updates product content
     * @param session - The authenticated session
     * @param productId - The Shopify product ID
     * @param content - The new product content
     * @returns Success indicator
     */
    updateProductContent(
      session: any,
      productId: string,
      content: ProductContent
    ): Promise<boolean>;
  }

  // Import types
  import { ProductData, StoreContext, ProductContent } from '../models/types';
  import shopify from '../shopify.server';

  /**
   * Implementation of the Product Data Facade
   * This interacts with the Shopify Admin API to retrieve and update product data
   */
  class ProductDataService implements ProductDataFacade {
    async getProductById(session: any, productId: string): Promise<ProductData> {
      try {
        // Get the admin API client from the session
        const { admin } = await shopify.authenticate.admin(session);

        // GraphQL query to get product data
        const response = await admin.graphql(`
          query GetProduct($id: ID!) {
            product(id: $id) {
              id
              title
              description
              descriptionHtml
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
              metafields(first: 20) {
                edges {
                  node {
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        `, {
          variables: {
            id: `gid://shopify/Product/${productId}`
          }
        });

        const data = await response.json();

        // Transform the response into our ProductData format
        const product = data.data.product;

        return {
          id: product.id,
          title: product.title,
          description: product.description,
          images: product.images.edges.map((edge: any) => ({
            id: edge.node.id,
            url: edge.node.url,
            altText: edge.node.altText,
          })),
          metafields: product.metafields.edges.map((edge: any) => ({
            namespace: edge.node.namespace,
            key: edge.node.key,
            value: edge.node.value,
          })),
        };
      } catch (error) {
        console.error('Error fetching product data:', error);
        throw new Error(`Failed to fetch product data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    async getStoreContext(session: any): Promise<StoreContext> {
      try {
        // Get the admin API client from the session
        const { admin } = await shopify.authenticate.admin(session);

        // GraphQL query to get store data
        const response = await admin.graphql(`
          query GetShopInfo {
            shop {
              id
              name
              description
              email
              primaryDomain {
                url
              }
            }
          }
        `);

        const data = await response.json();

        // Transform the response into our StoreContext format
        const shop = data.data.shop;

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description || '',
          domain: shop.primaryDomain.url,
          email: shop.email,
        };
      } catch (error) {
        console.error('Error fetching store context:', error);
        throw new Error(`Failed to fetch store context: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    async updateProductContent(
      session: any,
      productId: string,
      content: ProductContent
    ): Promise<boolean> {
      try {
        // Get the admin API client from the session
        const { admin } = await shopify.authenticate.admin(session);

        // GraphQL mutation to update product
        const response = await admin.graphql(`
          mutation UpdateProduct($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: {
            input: {
              id: `gid://shopify/Product/${productId}`,
              title: content.title,
              descriptionHtml: content.description,
              // Can add SEO fields, metafields, etc. here as needed
            }
          }
        });

        const data = await response.json();

        // Check for errors
        if (data.data.productUpdate.userErrors.length > 0) {
          console.error('Error updating product:', data.data.productUpdate.userErrors);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error updating product content:', error);
        return false;
      }
    }
  }

  /**
   * Default implementation of the ProductDataFacade
   * This exports a singleton instance of the facade for use throughout the app
   */
  export const productDataFacade: ProductDataFacade = new ProductDataService();