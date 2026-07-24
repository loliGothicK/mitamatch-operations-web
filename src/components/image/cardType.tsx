import Image from "next/image";
import { match } from "ts-pattern";
import { Memoria } from "@/domain/memoria/memoria";
import { Avatar } from "@mui/material";
import { blue, green, grey, purple, red, yellow } from "@mui/material/colors";

export function CardTypeIcon({
  cardType,
  attribute,
  size,
}: {
  cardType: Memoria["cardType"];
  attribute?: Memoria["attribute"];
  size: number;
}) {
  const wh = {
    width: size * 0.82,
    height: size * 0.82,
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
    .with(undefined, () => avatar(grey[700]))
    .exhaustive();
}
