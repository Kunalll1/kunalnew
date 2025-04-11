// app/routes/app.settings.tsx

import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Select,
  Button,
  Banner,
  RangeSlider,
  InlineStack,
  BlockStack,
  Box,
  FormLayout
} from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';
import { authenticate } from '../shopify.server';
import { apiKeysFacade } from '../facades/apiKeys';
import { AppSettingsSchema } from '../models/schemas';
import { metafieldsFacade } from 'app/facades/metafields';
import { z } from 'zod';

/**
 * Custom hook for form validation
 */
function useFormValidation(schema: z.ZodSchema) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: Record<string, any>) => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  }, [schema]);

  const updateField = useCallback((field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    validate(newData);
  }, [formData, validate]);

  return { formData, updateField, errors, validate };
}

/**
 * Loader function to load initial settings
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('Loading settings page...');

  // Define the return type
  type LoaderReturn = {
    settings: {
      apiProvider: string;
      hasApiKey: boolean;
      customPrompt: string;
      defaultLength: number;
    };
    error?: string;
  };
  // Authenticate the request
  const session = await authenticate.admin(request);

  try {
    // Ensure metafield definitions exist
    await metafieldsFacade.setupMetafieldDefinitions(session);

    // Get API key settings
    const apiKeyData = await apiKeysFacade.getApiKey(session);

    // Get custom prompt from metafields
    const customPrompt = await metafieldsFacade.getMetafield(
      session,
      'apiservice',
      'custom_prompt'
    ) || '';

    // Get default length from metafields
    const defaultLengthStr = await metafieldsFacade.getMetafield(
      session,
      'apiservice',
      'default_length'
    );
    const defaultLength = defaultLengthStr ? parseInt(defaultLengthStr, 10) : 250;

    return json<LoaderReturn>({
      settings: {
        apiProvider: apiKeyData?.provider || 'openaiApiKey',
        hasApiKey: !!apiKeyData?.apiKey,
        customPrompt,
        defaultLength
      }
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    return json<LoaderReturn>({
      error: 'Error loading settings. Please try again.',
      settings: {
        apiProvider: 'openaiApiKey',
        hasApiKey: false,
        customPrompt: '',
        defaultLength: 250
      }
    });
  }
};

/**
 * Action function to handle settings form submission
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  console.log('Processing settings form submission...');
  // Authenticate the request
  const session = await authenticate.admin(request);

  // Parse the form data
  const formData = await request.formData();
  const apiProvider = formData.get('apiProvider') as string;
  const apiKey = formData.get('apiKey') as string;
  const customPrompt = formData.get('customPrompt') as string;
  const defaultLength = parseInt(formData.get('defaultLength') as string, 10);

  try {
    // Validate the form data
    AppSettingsSchema.parse({
      apiProvider,
      apiKey,
      customPrompt,
      defaultLength
    });

    // Save the API key
    if (apiKey) {
      console.log(`Saving API key for provider: ${apiProvider}`);
      const result = await apiKeysFacade.saveApiKey(session, apiProvider, apiKey);
      console.log(`API key save result: ${result ? 'success' : 'failed'}`);
    }

    // Save the custom prompt
    await metafieldsFacade.setMetafield(
      session,
      'apiservice',
      'custom_prompt',
      customPrompt
    );

    // Save the default length
    await metafieldsFacade.setMetafield(
      session,
      'apiservice',
      'default_length',
      defaultLength.toString()
    );

    return redirect('/app/settings?success=true');
  } catch (error) {
    console.error('Error saving settings:', error);
    return json<{ success: boolean; error?: string; }>({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while saving settings'
    });
  }
};

/**
 * Settings page component
 */
export default function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const settings = loaderData.settings;
  const error = loaderData.error;
  const submit = useSubmit();

  // Form validation
  const { updateField, errors, validate } = useFormValidation(AppSettingsSchema);

  // Form state
  const [apiProvider, setApiProvider] = useState(settings.apiProvider);
  const [apiKey, setApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState(settings.customPrompt);
  const [defaultLength, setDefaultLength] = useState(settings.defaultLength);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update form data when inputs change
  useEffect(() => {
    updateField('apiProvider', apiProvider);
    updateField('apiKey', apiKey);
    updateField('customPrompt', customPrompt);
    updateField('defaultLength', defaultLength);
  }, [apiProvider, apiKey, customPrompt, defaultLength, updateField]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    // Validate the form
    if (!validate({ apiProvider, apiKey, customPrompt, defaultLength })) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    // Create form data
    const data = new FormData();
    data.append('apiProvider', apiProvider);
    data.append('apiKey', apiKey);
    data.append('customPrompt', customPrompt);
    data.append('defaultLength', defaultLength.toString());

    // Submit the form
    submit(data, { method: 'post' });
  }, [apiProvider, apiKey, customPrompt, defaultLength, validate, submit]);

  // Handle response from action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setIsSaving(false);
      setSaveSuccess(true);
      // Reset the API key field after successful save
      setApiKey('');
    }
  }, []);

  // API provider options
  const apiProviderOptions = [
    { label: 'OpenAI', value: 'openaiApiKey' },
    { label: 'DeepSeek', value: 'deepseekApiKey' },
  ];

  return (
    <Page title="API Settings">
      <Layout>
        {/* Error Banner */}
        {error && (
          <Layout.Section>
            <Banner title="Error" tone="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Success Banner */}
        {saveSuccess && (
          <Layout.Section>
            <Banner title="Settings Saved" tone="success" onDismiss={() => setSaveSuccess(false)}>
              <p>Your settings have been saved successfully.</p>
            </Banner>
          </Layout.Section>
        )}

        {/* API Settings Card */}
        <Layout.Section>
          <Card>
            <Box padding="4">
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">AI Service Settings</Text>
                <FormLayout>
                  <Select
                    label="AI Service Provider"
                    options={apiProviderOptions}
                    value={apiProvider}
                    onChange={setApiProvider}
                    helpText="Select which AI service you want to use for content generation"
                  />

                  <TextField
                    label={`${apiProvider === 'openaiApiKey' ? 'OpenAI' : 'DeepSeek'} API Key`}
                    value={apiKey}
                    onChange={setApiKey}
                    type="password"
                    autoComplete="off"
                    helpText={`Enter your ${apiProvider === 'openaiApiKey' ? 'OpenAI' : 'DeepSeek'} API key. ${settings.hasApiKey ? 'Leave blank to keep using your current API key.' : ''}`}
                    error={errors.apiKey}
                  />

                  {apiProvider === 'openaiApiKey' && (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      To get an OpenAI API key, sign up at <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer">platform.openai.com</a> and create a key in the API section.
                    </Text>
                  )}

                  {apiProvider === 'deepseekApiKey' && (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      To get a DeepSeek API key, sign up at <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">platform.deepseek.com</a> and create a key in your account dashboard.
                    </Text>
                  )}
                </FormLayout>
              </BlockStack>
            </Box>

            <Box padding="4" borderBlockStartWidth="1">
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">Content Generation Settings</Text>
                <FormLayout>
                  <TextField
                    label="Custom Prompt"
                    value={customPrompt}
                    onChange={setCustomPrompt}
                    multiline={4}
                    autoComplete="off"
                    placeholder="Example: Our brand voice is friendly but professional. We sell premium products and want to highlight quality and craftsmanship."
                    helpText="This prompt will be used to guide the AI in generating content that matches your brand voice"
                    error={errors.customPrompt}
                  />

                  <RangeSlider
                    label="Default Content Length (words)"
                    value={defaultLength}
                    onChange={(value) => setDefaultLength(typeof value === 'number' ? value : value[0])}
                    min={100}
                    max={500}
                    output
                    error={errors.defaultLength}
                    helpText="Set the default length for generated content"
                  />
                </FormLayout>
              </BlockStack>
            </Box>

            <Box padding="4" borderBlockStartWidth="1">
              <InlineStack align="end">
                <Button variant="primary" onClick={handleSubmit} loading={isSaving}>
                  Save Settings
                </Button>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Instructions Card */}
        <Layout.Section>
          <Card>
            <Box padding="4">
              <BlockStack gap="4">
                <Text variant="headingMd" as="h3">Getting Started</Text>
                <BlockStack gap="3">
                  <Text variant="bodyMd" as="p">
                    To use the AI Content Generator, follow these steps:
                  </Text>

                  <BlockStack gap="2">
                    <Text variant="bodyMd" as="p">
                      1. Enter your AI service API key above
                    </Text>
                    <Text variant="bodyMd" as="p">
                      2. Customize the prompt to match your brand voice
                    </Text>
                    <Text variant="bodyMd" as="p">
                      3. Go to any product page in your Shopify admin
                    </Text>
                    <Text variant="bodyMd" as="p">
                      4. Click the "More actions" menu and select "Generate Product Content"
                    </Text>
                    <Text variant="bodyMd" as="p">
                      5. Review and apply the generated content to your product
                    </Text>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}