import React, { ComponentPropsWithoutRef, useState } from "react";
import Image from "next/image";

export const ImageWithFallback = (
  props: ComponentPropsWithoutRef<typeof Image> & { fallback: string },
) => {
  const { src, fallback, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc}
      onError={() => {
        setImgSrc(fallback);
      }}
    />
  );
};
