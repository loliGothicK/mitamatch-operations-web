"use client";

import { costumeList } from "@/domain/costume/costume";
import NotFound from "next/dist/client/components/builtin/not-found";
import { Layout } from "@/components/Layout";
import { characterList } from "@/domain/character/character";
import { Box, Card, CardContent, CardMedia, Typography } from "@mui/material";

export default function CostumeView({ name }: { name: string }) {
  const costumes = costumeList.filter((costume) => costume.name.includes(name));
  const character = characterList.find((character) => character.name === name);

  if (costumes.length !== 0 && character !== undefined) {
    return (
      <Layout>
        <Card sx={{ display: "flex" }}>
          <CardMedia
            component="img"
            sx={{ width: 151 }}
            image={`/character/${name}.png`}
            alt="Live from space album cover"
          />
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: "1 0 auto" }}>
              <Typography component="div" variant="h5">
                Live From Space
              </Typography>
              <Typography variant="subtitle1" component="div" sx={{ color: "text.secondary" }}>
                Mac Miller
              </Typography>
            </CardContent>
          </Box>
        </Card>
      </Layout>
    );
  }

  return <NotFound />;
}
