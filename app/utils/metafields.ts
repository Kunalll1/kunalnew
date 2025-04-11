// app/utils/metafields.ts

import shopify  from "../shopify.server";

/**
 * Metafields service implementation
 * Provides operations for working with Shopify metafields
 */
class MetafieldsService {
  /**
   * Ensures that required metafield definitions exist
   * @param session - The authenticated session
   * @returns Promise resolving to a success indicator
   */
  async setupMetafieldDefinitions(session: any): Promise<boolean> {
    try {
      // Get the admin API client from the session
      const { admin } = await shopify.authenticate.admin(session);

      // Define metafields for API keys and settings
      const metafieldDefinitions = [
        {
          name: "Encrypted API Key",
          namespace: "apiservice",
          key: "encrypted_key",
          description: "Encrypted API key for AI services",
          type: "single_line_text_field",
          ownerType: "SHOP"
        },
        {
          name: "API Provider",
          namespace: "apiservice",
          key: "provider",
          description: "The AI service provider",
          type: "single_line_text_field",
          ownerType: "SHOP"
        },
        {
          name: "Custom Prompt",
          namespace: "apiservice",
          key: "custom_prompt",
          description: "Custom prompt for AI content generation",
          type: "multi_line_text_field",
          ownerType: "SHOP"
        },
        {
          name: "Default Length",
          namespace: "apiservice",
          key: "default_length",
          description: "Default content length (words)",
          type: "number_integer",
          ownerType: "SHOP"
        }
      ];

      // Create each metafield definition
      for (const definition of metafieldDefinitions) {
        await admin.graphql(`
          mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                name
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: {
            definition
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error setting up metafield definitions:', error);
      return false;
    }
  }

  /**
   * Gets a metafield value
   * @param session - The authenticated session
   * @param namespace - The metafield namespace
   * @param key - The metafield key
   * @returns Promise resolving to the metafield value or null
   */
  async getMetafield(session: any, namespace: string, key: string): Promise<string | null> {
    try {
      // Get the admin API client from the session
      const { admin } = await shopify.authenticate.admin(session);

      const response = await admin.graphql(`
        query GetMetafield($namespace: String!, $key: String!) {
          shop {
            metafield(namespace: $namespace, key: $key) {
              value
              type
            }
          }
        }
      `, {
        variables: {
          namespace,
          key
        }
      });

      const responseJson = await response.json();
      const metafield = responseJson.data.shop.metafield;

      if (!metafield) {
        return null;
      }

      return metafield.value;
    } catch (error) {
      console.error('Error getting metafield:', error);
      return null;
    }
  }

  /**
   * Sets a metafield value
   * @param session - The authenticated session
   * @param namespace - The metafield namespace
   * @param key - The metafield key
   * @param value - The value to store
   * @returns Promise resolving to a success indicator
   */
  async setMetafield(session: any, namespace: string, key: string, value: string): Promise<boolean> {
    try {
      // Get the admin API client from the session
      const { admin } = await shopify.authenticate.admin(session);

      console.log(`Setting metafield ${namespace}.${key} to value: ${value}`);

      // Determine the metafield type based on the key
      let type = "single_line_text_field";
      if (key === "custom_prompt") {
        type = "multi_line_text_field";
      } else if (key === "default_length") {
        type = "number_integer";
      }

      const response = await admin.graphql(`
        mutation SetMetafield($input: MetafieldInput!) {
          metafieldsSet(metafields: [$input]) {
            metafields {
              id
              namespace
              key
              value
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
            namespace,
            key,
            value,
            type,
            ownerId: `gid://shopify/Shop/${session.shop}`
          }
        }
      });

      const responseJson = await response.json();

      console.log('Metafield set response:', JSON.stringify(responseJson, null, 2));

      // Check for errors
      const userErrors = responseJson.data.metafieldsSet?.userErrors || [];

      if (userErrors.length > 0) {
        console.error('Errors setting metafield:', userErrors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting metafield:', error);
      return false;
    }
  }
}

/**
 * Singleton instance of the metafields service
 */
export const metafieldsService = new MetafieldsService();