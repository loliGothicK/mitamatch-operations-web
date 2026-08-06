"use client";


import { Box, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import Link from "@/components/link";

import { OrderIcon } from "@/components/image/OrderIcon";
import { type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { type Order } from "@/domain/order/order";
import { type Weapon, weaponList } from "@/domain/weapon/weapon";
import { type Costume, costumeList } from "@/domain/costume/costume";
import recentData from "@/domain/recent.json";
import { CostumeIcon } from "@/components/image/CostumeIcon";
import { WeaponIcon } from "@/components/image/WeaponIcon";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import Image from "next/image";

type RecentItem =
  | { kind: "memoria"; item: Memoria }
  | { kind: "order"; item: Order }
  | { kind: "weapon"; item: Weapon }
  | { kind: "costume"; item: Costume };

const seenMemoria = new Set<string>();

const recentItems: RecentItem[] = recentData.data
  .map((entry) => {
    if (entry.type === "memoria") {
      const item = memoriaList.find((m) => m.id === entry.id);
      if (item) {
        if (seenMemoria.has(item.uniqueId)) return null;
        seenMemoria.add(item.uniqueId);
        return { kind: "memoria" as const, item };
      }
    }
    if (entry.type === "costume") {
      const item = costumeList.find((c) => c.id === entry.id);
      return item ? { kind: "costume" as const, item } : null;
    }
    if (entry.type === "weapon") {
      const item = weaponList.find((w) => w.id === entry.id);
      return item ? { kind: "weapon" as const, item } : null;
    }
    return null;
  })
  .filter((item) => item !== null) as RecentItem[];

export default function Recent() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h3" gutterBottom>
        Data
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Explore the latest Memoria, Costume, Character, Order, and Weapon data.
      </Typography>
      <Typography component="h2" variant="h4" gutterBottom>
        Recently Added
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 2,
        }}
      >
        {recentItems.map((entry) => (
          <RecentCard key={`${entry.kind}-${entry.item.id}`} entry={entry} />
        ))}
      </Box>
      <Typography component="h2" variant="h4" sx={{ mt: 5 }} gutterBottom>
        Browse Data
      </Typography>
      <Grid container spacing={2}>
        {["Memoria", "Costume", "Character", "Order", "Weapon"].map((label) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea component={Link} href={`/data/${label.toLowerCase()}`}>
                <CardContent>
                  <Typography variant="h5">{label}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function RecentCard({ entry }: { entry: RecentItem }) {
  const { kind, item } = entry;
  const name = kind === "memoria" ? item.name.full : item.name;
  const href =
    kind === "order"
      ? `/data/order/${item.id}`
      : kind === "weapon"
        ? `/data/weapon/${item.id}`
        : kind === "costume"
          ? `/data/costume/${encodeURI(item.name)}`
          : `/data/memoria/${encodeURI(item.name.full)}?type=${Math.min(...memoriaList.filter((m) => m.uniqueId === item.uniqueId).map((m) => m.cardType))}`;


  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
          {kind === "order" ? (
            <OrderIcon order={item} size={80} />
          ) : kind === "costume" ? (
            <CostumeIcon costume={item} size={80} />
          ) : kind === "weapon" ? (
            <WeaponIcon weapon={item} size={80} />
          ) : (
            <Box sx={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
              <Box
                sx={{
                  position: "absolute",
                  zIndex: 2,
                }}
              >
                <Image
                  src={
                    item.labels.includes("Ultimate")
                      ? "/assets/IconRarity08LImage.png"
                      : "/assets/IconRarity06LImage.png"
                  }
                  alt="frame"
                  width={80}
                  height={80}
                />
              </Box>
              <ImageWithFallback
                src={`/memoria/${item.uniqueId}.png`}
                fallback="/memoria/CommingSoon.jpeg"
                alt={item.name.full}
                width={80}
                height={80}
              />
            </Box>
          )}
        </Box>
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Typography variant="body2" noWrap sx={{ fontSize: "0.75rem", textAlign: "center" }}>
            {name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
