"use client";

import { captureException } from "@sentry/nextjs";
import { default as NextError } from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang={"en"}>
      <body>
        <NextError statusCode={404} />
      </body>
    </html>
  );
}
