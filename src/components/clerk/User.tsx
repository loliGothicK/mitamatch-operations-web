import { ClerkLoading, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

export default function User() {
  return (
    <Suspense>
      <ClerkLoading></ClerkLoading>
      <SignedOut></SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </Suspense>
  );
}
