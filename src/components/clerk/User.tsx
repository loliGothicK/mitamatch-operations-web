import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { IconButton } from "@mui/material";

export default function User() {
  return (
    <Suspense>
      <SignedOut>
        <SignInButton mode={"modal"}>Sign in</SignInButton>
      </SignedOut>
      <SignedIn>
        <IconButton sx={{ ml: 1 }} color="inherit" component="div">
          <UserButton />
        </IconButton>
      </SignedIn>
    </Suspense>
  );
}
