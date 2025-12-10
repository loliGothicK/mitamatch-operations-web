import type { Metadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";
import { auth } from "@clerk/nextjs/server";
import { Layout } from "@/components/layout/client";
import { getUserData } from "@/database";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";

export default async function Page() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  const userData = await getUserData(userId);

  return (
    <Layout userData={userData}>
      <Box
        sx={{
          width: "80%",
          mx: "auto",
          p: 3,
          mt: 4,
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        <Typography>Hello, {userData.userId}</Typography>
      </Box>
    </Layout>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return pipe(
    defaultMetadata,
    Meta.openGraph.modify((openGraph) => ({
      ...openGraph,
      title: "Dashboard",
      description: "Mitamatch Operations / Dashboard",
    })),
    Meta.twitter.modify((twitter) => ({
      ...twitter,
      title: "Dashboard",
      description: "Mitamatch Operations / Dashboard",
      card: "summary",
    })),
  );
}
