import { Theme, useMediaQuery } from "@mui/system";

export const useSize = () => {
  const isMobileSize = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("xs"),
  );
  return { isMobileSize };
};
