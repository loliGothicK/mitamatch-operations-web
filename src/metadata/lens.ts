import { Lens } from "monocle-ts";
import type { Metadata } from "next";

export const Meta = {
  openGraph: Lens.fromPath<Metadata>()(["openGraph"]),
  twitter: Lens.fromPath<Metadata>()(["twitter"]),
};
