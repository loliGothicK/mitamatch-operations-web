import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { IconButton } from "@mui/material";

export default function User() {
  return (
    <Suspense>
      <Show when={"signed-out"}>
        <SignInButton mode={"modal"}>Sign in</SignInButton>
      </Show>
      <Show when={"signed-in"}>
        <IconButton sx={{ ml: 1 }} color="inherit" component="div">
          <UserButton />
        </IconButton>
      </Show>
    </Suspense>
  );
}
