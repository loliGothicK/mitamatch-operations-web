export const dynamic = 'force-dynamic';

// A faulty API route to test Sentry's error monitoring
// biome-ignore lint/style/useNamingConvention: <explanation>
export function GET() {
  throw new Error('Sentry Example API Error');
  // return NextResponse.json({ data: 'Testing Sentry Error...' });
}
