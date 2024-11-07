import {registerOTel} from "@vercel/otel";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node.js');
  }
  else {
    registerOTel({
      serviceName: "mitamatch-operations",
    });
  }
}
