import {
  GridColDef,
  GridValidRowModel,
  DataGrid as MuiDataGrid,
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { Dispatch, RefObject, SetStateAction } from "react";
import { GridApiCommunity } from "@mui/x-data-grid/internals";

type Props<T extends GridValidRowModel> = {
  apiRef: RefObject<GridApiCommunity | null>;
  data: readonly T[];
  columns: readonly GridColDef<T>[];
  visivility: [GridColumnVisibilityModel, Dispatch<SetStateAction<GridColumnVisibilityModel>>];
};

const paginationModel = { page: 0, pageSize: 10 };

export function DataGrid<T extends GridValidRowModel>({
  apiRef,
  data,
  columns,
  visivility: [visivility, setVisivility],
}: Props<T>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <MuiDataGrid
        apiRef={apiRef}
        rows={data}
        rowHeight={80}
        columns={columns}
        columnVisibilityModel={visivility}
        onColumnVisibilityModelChange={setVisivility}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10, 50, 100]}
        sx={{ border: 0 }}
      />
    </div>
  );
}
