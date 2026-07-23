import { vi } from "vitest";

// Globally mock ImageWithFallback to prevent rendering errors with next/image in Vitest
vi.mock("@/components/image/ImageWithFallback", () => ({
  ImageWithFallback: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
