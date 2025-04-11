
/**
 * ApiKeysFacade provides a simple interface for managing AI service API keys.
 * It abstracts away the complexity of encrypting, storing, and retrieving keys.
 */
export interface ApiKeysFacade {
    /**
     * Saves an API key for a provider
     * @param session - The authenticated session
     * @param provider - The AI service provider (e.g., "openai", "deepseek")
     * @param apiKey - The API key to save
     * @returns Success indicator
     */
    saveApiKey(session: any, provider: string, apiKey: string): Promise<boolean>;
    
    /**
     * Gets the stored API key for a provider
     * @param session - The authenticated session
     * @param provider - The AI service provider
     * @returns The API key and provider information, or null if not found
     */
    getApiKey(session: any, provider?: string): Promise<{ provider: string; apiKey: string } | null>;
    
    /**
     * Deletes a stored API key
     * @param session - The authenticated session
     * @param provider - The AI service provider
     * @returns Success indicator
     */
    deleteApiKey(session: any, provider: string): Promise<boolean>;
  }
  
  // Import dependencies
  import { encryptionFacade } from './encryption';
  import { metafieldsFacade } from './metafields';
  
  // Constants
  const API_KEY_NAMESPACE = 'apiservice';
  const API_KEY_FIELD_KEY = 'encrypted_key';
  const API_KEY_PROVIDER_KEY = 'provider';
  
  /**
   * Implementation of the API Keys Facade
   * This combines the encryption and metafields facades to provide API key management
   */
  class ApiKeysService implements ApiKeysFacade {
    async saveApiKey(session: any, provider: string, apiKey: string): Promise<boolean> {
      try {
        // Encrypt the API key
        const encryptedKey = await encryptionFacade.encrypt(apiKey);
        
        // Save the encrypted key and provider to metafields
        await metafieldsFacade.setMetafield(session, API_KEY_NAMESPACE, API_KEY_FIELD_KEY, encryptedKey);
        await metafieldsFacade.setMetafield(session, API_KEY_NAMESPACE, API_KEY_PROVIDER_KEY, provider);
        
        return true;
      } catch (error) {
        console.error('Error saving API key:', error);
        return false;
      }
    }
    
    async getApiKey(session: any, provider?: string): Promise<{ provider: string; apiKey: string } | null> {
      try {
        // Get the encrypted key from metafields
        const encryptedKey = await metafieldsFacade.getMetafield(
          session, 
          API_KEY_NAMESPACE, 
          API_KEY_FIELD_KEY
        );
        
        if (!encryptedKey) {
          return null;
        }
        
        // Get the stored provider
        const storedProvider = await metafieldsFacade.getMetafield(
          session, 
          API_KEY_NAMESPACE, 
          API_KEY_PROVIDER_KEY
        );
        
        // If a specific provider was requested, check if it matches
        if (provider && storedProvider !== provider) {
          return null;
        }
        
        // Decrypt the API key
        const apiKey = await encryptionFacade.decrypt(encryptedKey);
        
        return {
          provider: storedProvider || 'unknown',
          apiKey
        };
      } catch (error) {
        console.error('Error getting API key:', error);
        return null;
      }
    }
    
    async deleteApiKey(session: any, provider: string): Promise<boolean> {
      try {
        // Only delete if the stored provider matches the requested provider
        const storedProvider = await metafieldsFacade.getMetafield(
          session, 
          API_KEY_NAMESPACE, 
          API_KEY_PROVIDER_KEY
        );
        
        if (storedProvider !== provider) {
          return false;
        }
        
        // Delete the metafields
        await metafieldsFacade.setMetafield(session, API_KEY_NAMESPACE, API_KEY_FIELD_KEY, '');
        await metafieldsFacade.setMetafield(session, API_KEY_NAMESPACE, API_KEY_PROVIDER_KEY, '');
        
        return true;
      } catch (error) {
        console.error('Error deleting API key:', error);
        return false;
      }
    }
  }
  
  /**
   * Default implementation of the ApiKeysFacade
   * This exports a singleton instance of the facade for use throughout the app
   */
  export const apiKeysFacade: ApiKeysFacade = new ApiKeysService();