import { FormEvent, MouseEvent, useState } from 'react';

import { Edit } from '@mui/icons-material';
import {
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
  TextField,
} from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Order } from '@/domain/order/order';

import { Handle, NodeProps, Position } from 'reactflow';

function OrderNode({ data, isConnectable }: NodeProps<{ order: Order }>) {
  const [pic, setPic] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);

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
    <>
      <div className="order-node" style={{ padding: 0 }}>
        <Handle
          type="target"
          position={Position.Top}
          id="a"
          isConnectable={isConnectable}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="b"
          isConnectable={isConnectable}
        />
        <Card
          sx={{ display: 'flex', padding: 0 }}
          onContextMenu={handleContextMenu}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <CardMedia
              component="img"
              sx={{ width: 50, height: 50, padding: 0 }}
              image={`/order/${data.order.name}.png`}
            />
            <CardContent>
              <Typography
                variant="body1"
                fontSize={10}
                color="text.secondary"
                component="div"
              >
                {data.order.name}
              </Typography>
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
          id="c"
          isConnectable={isConnectable}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="d"
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
      </Menu>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData as any).entries());
            setPic(formJson.pic);
            handleClose();
          },
        }}
      >
        <DialogTitle>Edit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            defaultValue={pic}
            margin="dense"
            id="pic"
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
    </>
  );
}

export default OrderNode;
