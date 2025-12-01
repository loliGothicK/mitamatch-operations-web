"use client";

import { costumeList } from "@/domain/costume/costume";
import NotFound from "next/dist/client/components/builtin/not-found";
import { Layout } from "@/components/Layout";
import { Character, characterList } from "@/domain/character/character";
import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { Lenz } from "@/domain/lenz";
import Link from "@/components/link";
import { BindRune } from "@/components/runes/bindrune";
import { match, P } from "ts-pattern";
import { sort } from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Ord";
import Toolbar from "@mui/material/Toolbar";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { comparator } from "@/functional/proj";

const byGarden = pipe(
  N.Ord,
  O.contramap((character: Character) =>
    match(character.garden)
      .with("百合ヶ丘女学院高等学校", () => 1)
      .with("エレンスゲ女学園高等学校", () => 2)
      .with("神庭女子藝術高等学校", () => 3)
      .with("御台場女学校", () => 4)
      .with("私立ルドビコ女学院", () => 5)
      .with("", () => Number.POSITIVE_INFINITY)
      .run(),
  ),
);

export default function Detail({ name }: { name: string }) {
  const costumes = costumeList
    .filter((costume) => name.includes(Lenz.costume.general.name.lily.get(costume)))
    .toSorted(comparator("released", "desc"));
  const character = characterList.find((character) => character.name === name);
  const characters = sort(byGarden)(
    characterList.filter(({ name, garden }) => !name.includes(garden) || garden.length === 0),
  ).map((character) => character.name);

  const index = characters.indexOf(name);

  if (costumes.length !== 0 && character !== undefined) {
    const dir = match(character.firstName)
      .with(
        P.union("ミリアム", "来夢", "幸恵", "百合亜", "聖恋", "佳世", "日葵"),
        () => character.firstName,
      )
      .otherwise(() => character.name);

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
          <AppBar position="static">
            <Toolbar>
              {/* 右寄せ */}
              {characters[index - 1] && (
                <Link href={`/data/character/${characters[index - 1]}`}>
                  <Button variant="contained">
                    <NavigateBefore />
                    <Typography>{characters[index - 1]}</Typography>
                  </Button>
                </Link>
              )}
              <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ marginLeft: "auto" }}>
                <Link underline="hover" color="inherit" href="/data">
                  data
                </Link>
                <Link underline="hover" color="inherit" href="/data/character">
                  character
                </Link>
                <Typography sx={{ color: "text.primary" }}>{name}</Typography>
              </Breadcrumbs>
              {characters[index + 1] && (
                <Link href={`/data/character/${characters[index + 1]}`} sx={{ marginLeft: "auto" }}>
                  <Button variant="contained">
                    <Typography>{characters[index + 1]}</Typography>
                    <NavigateNext />
                  </Button>
                </Link>
              )}
            </Toolbar>
          </AppBar>
          <Card sx={{ display: "flex", width: "100%" }}>
            <CardMedia component="img" sx={{ width: 200 }} image={`/lily/${name}.jpg`} alt={name} />
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
            {character.bindRune && (
              <BindRune
                first={character.bindRune[0]}
                second={character.bindRune[1]}
                width={200}
                height={300}
              />
            )}
          </Card>
          <Divider sx={{ margin: 2 }} flexItem={true} textAlign="left">
            {"衣装"}
          </Divider>
          <Grid container={true} spacing={2} sx={{ width: "100%" }}>
            {costumes.map((costume) => (
              <Grid size={2.4} key={costume.name} p={1}>
                <Card
                  key={costume.name}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    padding: 2,
                  }}
                >
                  <Link
                    href={`/data/costume/${dir}/${Lenz.costume.general.name.normalized.job.get(costume)}`}
                  >
                    <CardMedia
                      component="img"
                      sx={{ width: 150 }}
                      image={`/costume/icon/${dir}/${Lenz.costume.general.name.normalized.job.get(costume)}.jpg`}
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
