"use client";

import { Box, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import Link from "@/components/link";

import { OrderIcon } from "@/components/image/OrderIcon";
import { type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { type Order, orderList } from "@/domain/order/order";
import { type Weapon, weaponList } from "@/domain/weapon/weapon";
import { type Costume, costumeList } from "@/domain/costume/costume";
import { recentData, type RecentItemEntry } from "@/domain/recent/recent";
import { CostumeIcon } from "@/components/image/CostumeIcon";
import { WeaponIcon } from "@/components/image/WeaponIcon";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import Image from "next/image";
import { match } from "ts-pattern";

type RecentItem =
  | { kind: "memoria"; item: Memoria }
  | { kind: "order"; item: Order }
  | { kind: "weapon"; item: Weapon }
  | { kind: "costume"; item: Costume };

function getRecentItems(data: readonly RecentItemEntry[]) {
  const seenMemoria = new Set<string>();
  let hasValidNonPhantasm = false;
  let hasValidPhantasm = false;

  const items = data
    .map((entry) => {
      const result: RecentItem | null = match(entry.type)
        .with("memoria", () => {
          const item = memoriaList.find((m) => m.id === entry.id);
          if (item && !seenMemoria.has(item.uniqueId)) {
            seenMemoria.add(item.uniqueId);
            return { kind: "memoria" as const, item };
          }
          return null;
        })
        .with("costume", () => {
          const item = costumeList.find((c) => c.id === entry.id);
          return item ? { kind: "costume" as const, item } : null;
        })
        .with("weapon", () => {
          const item = weaponList.find((w) => w.id === entry.id);
          return item ? { kind: "weapon" as const, item } : null;
        })
        .with("order", () => {
          const item = orderList.find((o) => o.id === entry.id);
          return item ? { kind: "order" as const, item } : null;
        })
        .exhaustive();

      if (result) {
        if (result.item.phantasm) {
          hasValidPhantasm = true;
          return null;
        }
        hasValidNonPhantasm = true;
        return result;
      }
      return null;
    })
    .filter((item) => item !== null) as RecentItem[];

  return { items, allPhantasm: hasValidPhantasm && !hasValidNonPhantasm };
}

let { items: recentItems, allPhantasm } = getRecentItems(recentData.data);

if (allPhantasm && recentData.prev) {
  const prevResult = getRecentItems(recentData.prev);
  recentItems = prevResult.items;
}

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
      <Typography component="h2" variant="h4" sx={{ mt: 5 }} gutterBottom>
        Recently Added
      </Typography>
      {["memoria", "costume", "weapon", "order"].map((kind) => {
        const items = recentItems.filter((entry) => entry.kind === kind);
        if (items.length === 0) return null;

        const label = kind.charAt(0).toUpperCase() + kind.slice(1);

        return (
          <Box key={kind} sx={{ mb: 4 }}>
            <Typography component="h3" variant="h6" sx={{ mb: 2 }} color="text.secondary">
              {label}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 2,
              }}
            >
              {items.map((entry) => (
                <RecentCard key={`${entry.kind}-${entry.item.id}`} entry={entry} />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function RecentCard({ entry }: { entry: RecentItem }) {
  const name = match(entry)
    .with({ kind: "memoria" }, ({ item }) => item.name.full)
    .otherwise(({ item }) => item.name);

  const href = match(entry)
    .with({ kind: "order" }, ({ item }) => `/data/order/${item.id}`)
    .with({ kind: "weapon" }, ({ item }) => `/data/weapon/${item.id}`)
    .with({ kind: "costume" }, ({ item }) => `/data/costume/${encodeURI(item.name)}`)
    .with(
      { kind: "memoria" },
      ({ item }) =>
        `/data/memoria/${encodeURI(item.name.full)}?type=${Math.min(...memoriaList.filter((m) => m.uniqueId === item.uniqueId).map((m) => m.cardType))}`,
    )
    .exhaustive();

  const icon = match(entry)
    .with({ kind: "order" }, ({ item }) => <OrderIcon order={item} size={80} />)
    .with({ kind: "costume" }, ({ item }) => <CostumeIcon costume={item} size={80} />)
    .with({ kind: "weapon" }, ({ item }) => <WeaponIcon weapon={item} size={80} />)
    .with({ kind: "memoria" }, ({ item }) => (
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
            unoptimized
            style={{ width: "100%", height: "100%" }}
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
    ))
    .exhaustive();

  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>{icon}</Box>
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Typography variant="body2" noWrap sx={{ fontSize: "0.75rem", textAlign: "center" }}>
            {name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
