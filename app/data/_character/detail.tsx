"use client";

import { costumeList } from "@/domain/costume/costume";
import NotFound from "next/dist/client/components/builtin/not-found";
import { Layout } from "@/components/Layout";
import { characterList } from "@/domain/character/character";
import {Box, Card, CardActions, CardContent, CardMedia, Divider, Grid, Typography} from "@mui/material";
import { Lenz } from "@/domain/lenz";
import Link from "@/components/link";

export default function Detail({ name }: { name: string }) {
  const costumes = costumeList.filter((costume) =>
    name.includes(Lenz.costume.general.name.lily.get(costume)),
  );
  const character = characterList.find((character) => character.name === name);

  if (costumes.length !== 0 && character !== undefined) {
    return (
      <Layout>
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
          <Card sx={{ display: "flex", width: "100%" }}>
            <CardMedia component="img" sx={{ width: 150 }} image={`/lily/${name}.jpg`} alt={name} />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flex: "1 0 auto" }}>
                <Typography component="div" variant="h5">
                  {character.name}
                </Typography>
                <Typography variant="subtitle1" component="div" sx={{ color: "text.secondary" }}>
                  {character.introduction}
                </Typography>
              </CardContent>
            </Box>
          </Card>
          <Divider sx={{ margin: 2 }} flexItem={true} textAlign="left">
            {"衣装"}
          </Divider>
          <Grid container={true} spacing={2} sx={{ width: "100%" }}>
            {costumes.map((costume) => (
              <Grid size={2.4} key={costume.name} p={1}>
                <Card key={costume.name} sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", padding: 2 }}>
                  <Link
                    href={`/data/costume/${name}/${Lenz.costume.general.name.normalized.job.get(costume)}`}
                  >
                    <CardMedia
                      component="img"
                      sx={{ width: 150 }}
                      image={`/costume/icon/${name}/${Lenz.costume.general.name.normalized.job.get(costume)}.jpg`}
                      alt={name}
                    />
                  </Link>
                  <CardContent>
                    <Typography variant="body2" component="div">
                      {Lenz.costume.general.name.job.get(costume)}
                    </Typography>
                  </CardContent>
                  <CardActions></CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Layout>
    );
  }

  return <NotFound />;
}
