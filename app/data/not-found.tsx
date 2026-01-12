"use client"; // Error boundaries must be Client Components
import { Button } from "@mui/material";
import { useEffect } from "react";

export default function NotFound({
  error,
  action,
}: {
  error: Error & { digest?: string };
  action: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => action()
        }
      >
        {error.digest || "Try again"}
      </Button>
    </div>
  );
}
