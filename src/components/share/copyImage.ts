"use client";

import { toBlob } from "html-to-image";
import type { RefObject } from "react";

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function copyNodeAsImage(
  ref: RefObject<HTMLElement | null>,
  filename: string,
): Promise<"copied" | "downloaded"> {
  if (!ref.current) {
    throw new Error("share target not found");
  }

  const blob = await toBlob(ref.current, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  if (!blob) {
    throw new Error("failed to render image");
  }

  try {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      throw new Error("clipboard image is not supported");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    return "copied";
  } catch {
    await downloadBlob(blob, filename);
    return "downloaded";
  }
}
