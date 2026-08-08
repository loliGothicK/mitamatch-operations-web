"use client";

import Image from "next/image";
import { costumeList } from "@/domain/costume/costume";
import NotFound from "next/dist/client/components/builtin/not-found";
import { Character, characterList } from "@/domain/character/character";
import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { Lenz } from "@/domain/lenz";
import Link from "@/components/link";
import { BindRune } from "@/components/runes/bindrune";
import { match, P } from "ts-pattern";
import { sort } from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as M from "fp-ts/Monoid";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Ord";
import Toolbar from "@mui/material/Toolbar";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { CostumeIcon } from "@/components/image/CostumeIcon";
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
const byLegion = pipe(
  N.Ord,
  O.contramap((character: Character) =>
    match(character.legion)
      .with("一柳隊", () => 1)
      .with("アールヴヘイム", () => 2)
      .with("ローエングリン", () => 3)
      .with("レギンレイヴ", () => 4)
      .with("エイル", () => 5)
      .with("シュバルツグレイル", () => 6)
      .with("サングリーズル", () => 7)
      .with("シュヴェルトライテ", () => 8)
      .with("ヘルヴォル", () => 9)
      .with("クエレブレ", () => 10)
      .with("バシャンドレ", () => 11)
      .with("グラン・エプレ", () => 12)
      .with("神庭生徒会防衛隊", () => 13)
      .with("ロネスネス", () => 14)
      .with("ヘオロットセインツ", () => 15)
      .with("アイアンサイド", () => 16)
      .with("テンプルレギオン", () => 16)
      .otherwise(() => Number.POSITIVE_INFINITY),
  ),
);
const characterOrd = M.concatAll(O.getMonoid<Character>())([byGarden, byLegion]);

const gardenImage = (character: Character) =>
  match(character.garden)
    .with("", () => "/garden/garden_00_v.png")
    .otherwise(() => `/garden/${character.garden}_v.png`);

export default function Detail({ name }: { name: string }) {
  const costumes = costumeList
    .filter((costume) => name.includes(Lenz.costume.general.name.lily.get(costume)))
    .toSorted(comparator("released_at", "desc"));
  const character = characterList.find((character) => character.name === name);
  const characters = sort(characterOrd)(
    characterList.filter(({ name, garden }) => !name.includes(garden) || garden.length === 0),
  ).map((character) => character.name);

  const index = characters.indexOf(name);

  if (character !== undefined) {
    const dir = match(character.firstName)
      .with(
        P.union("ミリアム", "来夢", "幸恵", "百合亜", "聖恋", "佳世", "日葵"),
        () => character.firstName,
      )
      .otherwise(() => character.name);

    return (
      <Box
        sx={{
          width: { xs: "100%", md: "90%", lg: "80%" },
          maxWidth: 1400,
          mx: "auto",
          p: { xs: 1, md: 3 },
          mt: { xs: 2, md: 4 },
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: { xs: 2, md: 3 },
        }}
      >
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Toolbar
            sx={{
              flexWrap: "nowrap",
              justifyContent: "space-between",
              py: 1,
              px: { xs: 0, sm: 2 },
            }}
          >
            {characters[index - 1] ? (
              <Link href={`/data/character/${characters[index - 1]}`}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: { xs: "auto", sm: 64 }, px: { xs: 1, sm: 2 } }}
                >
                  <NavigateBefore sx={{ mx: { xs: -1, sm: 0 } }} />
                  <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
                    {characters[index - 1]}
                  </Typography>
                </Button>
              </Link>
            ) : (
              <Box sx={{ width: { xs: 40, sm: 64 } }} />
            )}
            <Breadcrumbs
              separator="›"
              aria-label="breadcrumb"
              sx={{ mx: 1, display: "flex", justifyContent: "center" }}
            >
              <Link underline="hover" color="inherit" href="/data">
                data
              </Link>
              <Link underline="hover" color="inherit" href="/data/character">
                character
              </Link>
              <Typography sx={{ color: "text.primary" }}>{name}</Typography>
            </Breadcrumbs>
            {characters[index + 1] ? (
              <Link href={`/data/character/${characters[index + 1]}`}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: { xs: "auto", sm: 64 }, px: { xs: 1, sm: 2 } }}
                >
                  <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
                    {characters[index + 1]}
                  </Typography>
                  <NavigateNext sx={{ mx: { xs: -1, sm: 0 } }} />
                </Button>
              </Link>
            ) : (
              <Box sx={{ width: { xs: 40, sm: 64 } }} />
            )}
          </Toolbar>
        </AppBar>
        <Card
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "center", bgcolor: "background.default", p: 2 }}
          >
            <CardMedia
              component="img"
              sx={{ width: { xs: 150, md: 250 }, height: "auto", borderRadius: 2 }}
              image={`/lily/${name}.jpg`}
              alt={name}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <CardContent sx={{ flex: "1 0 auto", p: { xs: 2, sm: 3 } }}>
              <Stack
                spacing={2}
                direction={{ xs: "column", sm: "row" }}
                sx={{ alignItems: { xs: "center", sm: "flex-start" } }}
              >
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <Image
                    src={gardenImage(character)}
                    alt={character.garden}
                    width={80}
                    height={80}
                    unoptimized
                  />
                </Box>
                <Stack direction="column" sx={{ alignItems: { xs: "center", sm: "flex-start" } }}>
                  <Typography variant="body2" color="text.secondary">
                    {character.kanaName}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {character.name}
                  </Typography>
                  <Divider flexItem={true} sx={{ my: 1.5, width: "100%" }} />
                  <Stack
                    spacing={{ xs: 1, sm: 2 }}
                    direction={{ xs: "column", sm: "row" }}
                    sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {`誕生日: ${character.birthday}`}
                    </Typography>
                    <Divider
                      orientation="vertical"
                      flexItem={true}
                      sx={{ display: { xs: "none", sm: "block" } }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {`所属レギオン: ${character.legion}`}
                    </Typography>
                    <Divider
                      orientation="vertical"
                      flexItem={true}
                      sx={{ display: { xs: "none", sm: "block" } }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {`学年: ${character.grade}`}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} textAlign="left">
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                  Introduction
                </Typography>
              </Divider>
              <Typography variant="body1" sx={{ color: "text.primary", lineHeight: 1.6 }}>
                {character.introduction.replace(String.raw`\n`, "")}
              </Typography>
              <Divider sx={{ my: 2 }} textAlign="left">
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                  Information
                </Typography>
              </Divider>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <Chip label={`好きなもの: ${character.favorites}`} variant="outlined" />
                <Chip label={`苦手なもの: ${character.hates}`} variant="outlined" />
                <Chip label={`趣味: ${character.hobby}`} variant="outlined" />
              </Box>
            </CardContent>
          </Box>
          {character.bindRune && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
                bgcolor: "background.default",
              }}
            >
              <BindRune
                first={character.bindRune[0]}
                second={character.bindRune[1]}
                width={150}
                height={225}
              />
            </Box>
          )}
        </Card>
        <Divider sx={{ my: 3, width: "100%" }} textAlign="left">
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: "bold" }}>
            衣装一覧
          </Typography>
        </Divider>
        <Grid container={true} spacing={2} sx={{ width: "100%" }}>
          {costumes.map((costume) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }} key={costume.name} sx={{ p: 1 }}>
              <Card
                key={costume.name}
                variant="outlined"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  p: { xs: 1, sm: 2 },
                  height: "100%",
                  borderRadius: 2,
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <Link
                  href={`/data/costume/${dir}/${Lenz.costume.general.name.normalized.job.get(costume)}`}
                >
                  <CostumeIcon costume={costume} size={80} />
                </Link>
                <CardContent sx={{ p: 1, pb: "8px !important", textAlign: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {Lenz.costume.general.name.job.get(costume)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return <NotFound />;
}
