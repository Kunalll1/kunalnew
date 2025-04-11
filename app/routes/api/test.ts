import { type LoaderFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('Test API endpoint called');
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};
