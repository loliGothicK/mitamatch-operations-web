"use client";

import { decodeTime } from "ulid";
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import Link from "@/components/link";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { OrderIcon } from "@/components/image/OrderIcon";
import { type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { type Order, orderList } from "@/domain/order/order";
import { type Weapon, weaponList } from "@/domain/weapon/weapon";

type RecentItem =
  | { kind: "memoria"; item: Memoria }
  | { kind: "order"; item: Order }
  | { kind: "weapon"; item: Weapon };

const recentItems: RecentItem[] = [
  ...memoriaList.map((item) => ({ kind: "memoria" as const, item })),
  ...orderList.map((item) => ({ kind: "order" as const, item })),
  ...weaponList.map((item) => ({ kind: "weapon" as const, item })),
].sort((a, b) => decodeTime(b.item.id) - decodeTime(a.item.id));

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
      <Grid container spacing={2}>
        {recentItems.slice(0, 12).map((entry) => (
          <Grid key={`${entry.kind}-${entry.item.id}`} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
            <RecentCard entry={entry} />
          </Grid>
        ))}
      </Grid>
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
        : `/data/memoria/${encodeURI(item.name.full)}?type=${item.cardType}`;

  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
          {kind === "order" ? (
            <OrderIcon order={item} size={100} />
          ) : (
            <ImageWithFallback
              src={`/${kind}/${item.id}.png`}
              fallback={kind === "weapon" ? "/assets/Blank.png" : "/memoria/CommingSoon.jpeg"}
              alt={name}
              width={100}
              height={100}
            />
          )}
        </Box>
        <CardContent>
          <Typography variant="body2" noWrap>
            {name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
