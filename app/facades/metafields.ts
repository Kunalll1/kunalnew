
/**
 * MetafieldsFacade provides a simple interface for interacting with Shopify metafields.
 * It abstracts away the complexity of Shopify's GraphQL API for metafield operations.
 */
export interface MetafieldsFacade {
    /**
     * Gets a metafield value
     * @param session - The authenticated session
     * @param namespace - The metafield namespace
     * @param key - The metafield key
     * @returns The metafield value, or null if not found
     */
    getMetafield(session: any, namespace: string, key: string): Promise<string | null>;
    
    /**
     * Sets a metafield value
     * @param session - The authenticated session
     * @param namespace - The metafield namespace
     * @param key - The metafield key
     * @param value - The value to store
     * @returns Success indicator
     */
    setMetafield(session: any, namespace: string, key: string, value: string): Promise<boolean>;
    
    /**
     * Ensures that required metafield definitions exist
     * @param session - The authenticated session
     * @returns Success indicator
     */
    setupMetafieldDefinitions(session: any): Promise<boolean>;
  }
  
  // Import the actual implementation
  import { metafieldsService } from '../utils/metafields';
  
  /**
   * Default implementation of the MetafieldsFacade
   * This exports a singleton instance of the facade for use throughout the app
   */
  export const metafieldsFacade: MetafieldsFacade = metafieldsService;