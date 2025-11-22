import { useCallback, useState } from "react";
import { GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { match, P } from "ts-pattern";

export const useVisivility = (all: GridColumnVisibilityModel) => {
  const [visivility, setVisivility] = useState(all);

  const changed = useCallback(
    (whiteList: Set<GridColDef["field"]>) => {
      setVisivility(
        (prev): GridColumnVisibilityModel =>
          match(whiteList)
            .with(P.set("*"), () => all)
            .otherwise(() =>
              Object.fromEntries(
                Object.entries(prev).map(([field]) => [
                  field as GridColDef["field"],
                  whiteList.has(field),
                ]),
              ),
            ),
      );
    },
    [setVisivility],
  );

  return [visivility, setVisivility, changed] as const;
};
