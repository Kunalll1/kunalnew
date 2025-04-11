import { Page, Layout, Card, Text, BlockStack, List, Link, CalloutCard } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function Index() {
  return (
    <Page>
      <TitleBar title="AI Product Content Generator" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Welcome to AI Product Content Generator
                </Text>
                <Text as="p">
                  Transform your product listings with AI-generated titles and descriptions that capture 
                  your brand voice and drive conversions. This app uses advanced AI models to create 
                  compelling product content with just a few clicks.
                </Text>
                
                <Text as="h3" variant="headingMd">
                  How it works:
                </Text>
                
                <List type="number">
                  <List.Item>
                    Set up your API keys in the Settings page
                  </List.Item>
                  <List.Item>
                    Add custom prompts to help the AI understand your brand (optional)
                  </List.Item>
                  <List.Item>
                    Use the "Generate" button in your product editor to create titles and descriptions
                  </List.Item>
                </List>
                
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  Getting Started
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <CalloutCard
              title="Step 1: Configure Your API Keys"
              illustration="https://cdn.shopify.com/s/files/1/0/0/0/0000/files/api-key.png"
              primaryAction={{
                content: 'Go to Settings',
                url: '/app/settings',
              }}
            >
              <Text as="p">
                You'll need to enter your OpenAI or DeepSeek API keys to generate content. 
                Don't have an API key yet? We'll show you how to get one.
              </Text>
            </CalloutCard>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Step 2: Customize Your AI Prompts
                </Text>
                <Text as="p">
                  Help the AI understand your brand voice and product style by adding custom prompts.
                  These prompts guide the AI to generate content that matches your brand's unique characteristics.
                </Text>
                <Text as="p">
                  Examples of effective custom prompts:
                </Text>
                <List>
                  <List.Item>
                    "Our brand uses a casual, friendly tone with light humor."
                  </List.Item>
                  <List.Item>
                    "Products should be described with an emphasis on sustainability and eco-friendliness."
                  </List.Item>
                  <List.Item>
                    "We target young professionals aged 25-35 who value minimalist design."
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Step 3: Generate Your First AI Content
                </Text>
                <Text as="p">
                  Once you've set up your API keys, you'll see a new "Generate with AI" button 
                  in your product editor page. Click this button to:
                </Text>
                <List>
                  <List.Item>
                    Generate a compelling product title based on existing product information
                  </List.Item>
                  <List.Item>
                    Create a detailed product description that highlights key features and benefits
                  </List.Item>
                  <List.Item>
                    Review and edit the generated content before saving
                  </List.Item>
                </List>
                <Text as="p">
                  You can regenerate content as many times as needed until you're satisfied with the results.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Tips for Best Results
                </Text>
                <List>
                  <List.Item>
                    <Text as="span" fontWeight="bold">Start with good data:</Text> The more product information you provide, the better the AI results.
                  </List.Item>
                  <List.Item>
                    <Text as="span" fontWeight="bold">Be specific in custom prompts:</Text> Tell the AI about your target audience, brand voice, and product positioning.
                  </List.Item>
                  <List.Item>
                    <Text as="span" fontWeight="bold">Iterate as needed:</Text> Don't hesitate to regenerate content if the first result isn't perfect.
                  </List.Item>
                  <List.Item>
                    <Text as="span" fontWeight="bold">Review before publishing:</Text> Always check AI-generated content for accuracy before saving.
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Need Help?
                </Text>
                <Text as="p">
                  If you encounter any issues or have questions about using the AI Product Content Generator:
                </Text>
                <List>
                  <List.Item>
                    Visit our <Link url="https://example.com/help" external>help center</Link> for detailed guides
                  </List.Item>
                  <List.Item>
                    Email us at <Link url="mailto:support@aiproductcontent.com">support@aiproductcontent.com</Link>
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}