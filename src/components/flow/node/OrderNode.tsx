import { type FormEvent, type MouseEvent, useId, useState } from "react";

import { useAtom } from "jotai";

import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { type Order, orderList } from "@/domain/order/order";
import {
  type NodeData,
  edgeStorageAtom,
  idAtom,
  nodeStorageAtom,
} from "@/jotai/flowAtoms";

import { Handle, type NodeProps, Position } from "reactflow";

function OrderNode({ id, data, isConnectable }: NodeProps<NodeData>) {
  const [count, setCount] = useAtom(idAtom);
  const [nodes, setNodeStorage] = useAtom(nodeStorageAtom);
  const [edges, setEdgeStorage] = useAtom(edgeStorageAtom);
  const [pic, setPic] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Order | undefined>(data.order);
  const uniqueId = useId();

  const getCount = () => {
    setCount((prev) => prev + 1);
    return count;
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
          null,
    );
  };

  return (
    <Box onContextMenu={handleContextMenu}>
      <div className="order-node" style={{ padding: 0 }}>
        <Handle
          type="target"
          position={Position.Top}
          id={`top-${uniqueId}`}
          isConnectable={isConnectable}
        />
        <Handle
          type="source"
          position={Position.Left}
          id={`left-${uniqueId}`}
          isConnectable={isConnectable}
        />
        <Card sx={{ display: "flex", padding: 0 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: 0,
            }}
          >
            {order ? (
              <CardMedia
                component="img"
                sx={{ width: 50, height: 50, padding: 0 }}
                image={`/order/${order.name}.png`}
              />
            ) : (
              <CardMedia component="div">
                <Skeleton width={50} height={50} />
              </CardMedia>
            )}
            <CardContent>
              {order ? (
                <Typography
                  variant="body1"
                  fontSize={10}
                  color="text.secondary"
                  component="div"
                >
                  {order.name}
                </Typography>
              ) : (
                <Skeleton width={100} />
              )}
              <Typography
                variant="body1"
                fontSize={12}
                color="text.secondary"
                component="div"
              >
                {pic}
              </Typography>
            </CardContent>
          </Box>
        </Card>
        <Handle
          type="source"
          position={Position.Bottom}
          id={`bottom-${uniqueId}`}
          isConnectable={isConnectable}
        />
        <Handle
          type="source"
          position={Position.Right}
          id={`right-${uniqueId}`}
          isConnectable={isConnectable}
        />
      </div>
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            setContextMenu(null);
            handleClickOpen();
          }}
        >
          編集
        </MenuItem>
        <MenuItem
          onClick={() => {
            const self = nodes.find((n) => n.id === id)!;
            const newId = getCount().toString();
            setNodeStorage([
              ...nodes,
              {
                id: newId,
                type: "order",
                position: {
                  x: self.position.x,
                  y: self.position.y + 100,
                },
                data: { order: undefined },
              },
            ]);
            setEdgeStorage([
              ...edges,
              {
                id: `${id}-${newId}`,
                source: id,
                target: newId,
                sourceHandle: "bottom",
                targetHandle: "top",
                type: "labeld-edge",
              },
            ]);
          }}
        >
          Add Child
        </MenuItem>
      </Menu>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            setPic(formJson.pic as string);
            setOrder(orderList.find((o) => o.name === formJson.order));
            handleClose();
          },
        }}
      >
        <DialogTitle>Edit</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={orderList.filter((o) => o.payed).map((o) => o.name)}
            defaultValue={order?.name}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                id={`order-${uniqueId}`}
                name="order"
                label="Order"
                type="text"
                variant="standard"
              />
            )}
          />
        </DialogContent>
        <DialogContent>
          <TextField
            defaultValue={pic}
            margin="dense"
            id={`pic-${uniqueId}`}
            name="pic"
            label="PIC"
            type="text"
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrderNode;
