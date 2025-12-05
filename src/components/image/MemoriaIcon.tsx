import type { Memoria } from "@/domain/memoria/memoria";
import { match } from "ts-pattern";
import Image from "next/image";
import { Avatar, Box } from "@mui/material";
import { blue, green, purple, red, yellow } from "@mui/material/colors";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { ImageProps } from "next/dist/shared/lib/get-img-props";
import { StrictOmit } from "ts-essentials";

function CardTypeIcon({
  cardType,
  attribute,
  size,
  left,
}: {
  cardType: Memoria["cardType"];
  attribute: Memoria["attribute"];
  size: number;
  left: number;
}) {
  const wh = {
    width: size * 0.8,
    height: size * 0.8,
  };
  const kindImage = match(cardType)
    .with(1, () => <Image src={"/NormalSingle.png"} alt={"kind"} {...wh} />)
    .with(2, () => <Image src={"/NormalRange.png"} alt={"kind"} {...wh} />)
    .with(3, () => <Image src={"/SpecialSingle.png"} alt={"kind"} {...wh} />)
    .with(4, () => <Image src={"/SpecialRange.png"} alt={"kind"} {...wh} />)
    .with(5, () => <Image src={"/Assist.png"} alt={"kind"} {...wh} />)
    .with(6, () => <Image src={"/Interference.png"} alt={"kind"} {...wh} />)
    .with(7, () => <Image src={"/Recovery.png"} alt={"kind"} {...wh} />)
    .exhaustive();

  const avatar = (color: string) => (
    <Avatar
      sx={{
        width: size,
        height: size,
        left,
        position: "absolute",
        bgcolor: color,
      }}
    >
      {kindImage}
    </Avatar>
  );

  return match(attribute)
    .with("Fire", () => avatar(red[500]))
    .with("Water", () => avatar(blue[500]))
    .with("Wind", () => avatar(green[500]))
    .with("Light", () => avatar(yellow[500]))
    .with("Dark", () => avatar(purple[500]))
    .exhaustive();
}

export function MemoriaIcon({
  memoria: { name, cardType, attribute },
  size,
  ...option
}: { memoria: Memoria; size?: number } & StrictOmit<
  ImageProps,
  "src" | "alt" | "width" | "height"
>) {
  return (
    <Box sx={{ position: "relative" }}>
      <CardTypeIcon
        cardType={cardType}
        attribute={attribute}
        size={size ? size * 0.3 : 30}
        left={size ? size * 0.7 : 70}
      />
      <ImageWithFallback
        src={`/memoria/${name.short}.png`}
        fallback={"/memoria/CommingSoon.jpeg"}
        alt={name.full}
        width={size ?? 100}
        height={size ?? 100}
        {...option}
      />
    </Box>
  );
}
