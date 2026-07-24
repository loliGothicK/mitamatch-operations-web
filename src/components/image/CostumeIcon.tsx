import { match } from "ts-pattern";
import Image from "next/image";
import { Box } from "@mui/material";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { ImageProps } from "next/dist/shared/lib/get-img-props";
import { StrictOmit } from "ts-essentials";
import { Costume } from "@/domain/costume/costume";
import { CardTypeIcon } from "@/components/image/cardType";
import { isSome } from "fp-ts/Option";

export function CostumeIcon({
  costume: { uniqueId, name, cardType, specialSkill },
  size,
  ...option
}: { costume: Costume; size?: number } & StrictOmit<
  ImageProps,
  "src" | "alt" | "width" | "height"
>) {
  const isAdx = isSome(specialSkill) && specialSkill.value.type === "adx";
  const containerSize = size ?? 100;
  const innerSize = containerSize - 2;
  const isAwakable = isSome(specialSkill) && match(specialSkill.value)
      .with({ type: "ex" }, () => true)
      .with({ type: "adx" }, (adx) => adx.awakable)
      .exhaustive();

    return (
    <Box sx={{ position: "relative", width: containerSize, height: containerSize, flexShrink: 0 }}>
      <Box
        sx={{
          zIndex: 0,
          position: "absolute",
          top: 1,
          left: 1,
        }}
      >
        <Image src={"/assets/Blank.png"} alt={"blank"} width={innerSize} height={innerSize} />
      </Box>
      {/* アイコン！ */}
      {(isAdx || isAwakable) && (
        <Box
          sx={{
            position: "absolute",
            bottom: 2,
            left: 2,
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isAdx && isAwakable && (
            <Image
              src="/assets/adxAwakeningIcon.png"
              alt="adx-awakening"
              width={size ? size * 0.25 : 25}
              height={size ? size * 0.25 : 25}
            />
          )}
          {isAdx && (
            <Image
              src="/assets/adxIcon.png"
              alt="adx"
              width={size ? size * 0.25 : 25}
              height={size ? size * 0.25 : 25}
            />
          )}
          {!isAdx && isAwakable && (
            <Image
              src="/assets/jobAwakeningIcon.png"
              alt="awakening"
              width={size ? size * 0.25 : 25}
              height={size ? size * 0.25 : 25}
            />
          )}
        </Box>
      )}
      <Box
        sx={{
          zIndex: 1,
          position: "absolute",
          top: 2,
          left: 2,
        }}
      >
        <ImageWithFallback
          src={`/costume/icon/${uniqueId}.png`}
          fallback={"/memoria/CommingSoon.jpeg"}
          alt={name}
          width={innerSize}
          height={innerSize}
          {...option}
        />
      </Box>
      {isAdx ? (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <Image
            src={"/assets/IconRarity06LImage.png"}
            alt={"frame"}
            width={containerSize}
            height={containerSize}
          />
        </Box>
      ) : (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: containerSize,
            height: containerSize,
            border: "2px solid",
            borderColor: "grey.700",
            boxSizing: "border-box",
          }}
        />
      )}
      <Box
        sx={{
          position: "absolute",
          top: -1,
          right: -1,
          zIndex: 4,
        }}
      >
        <CardTypeIcon
          cardType={match(cardType)
            .with("通常単体", () => 1 as const)
            .with("通常範囲", () => 2 as const)
            .with("特殊単体", () => 3 as const)
            .with("特殊範囲", () => 4 as const)
            .with("支援", () => 5 as const)
            .with("妨害", () => 6 as const)
            .with("回復", () => 7 as const)
            .exhaustive()}
          size={size ? size * 0.34 : 34}
        />
      </Box>
    </Box>
  );
}
