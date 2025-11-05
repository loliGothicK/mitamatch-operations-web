"use client";

import { Layout } from "@/components/Layout";
import LabeledEdge from "@/components/flow/edge/LabeledEdge";
import OrderNode from "@/components/flow/node/OrderNode";
import { type Order, orderList } from "@/domain/order/order";
import { edgeStorageAtom, idAtom, nodeStorageAtom } from "@/jotai/flowAtoms";
import { Add } from "@mui/icons-material";
import { Autocomplete, Button, Modal, Stack, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useAtom } from "jotai";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  MiniMap,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

export default function FlowChart() {
  const [count, setCount] = useAtom(idAtom);
  const [cachedNodes, setNodeStorage] = useAtom(nodeStorageAtom);
  const [cachedEdges, setEdgeStorage] = useAtom(edgeStorageAtom);
  const [nodes, setNodes, onNodesChange] = useNodesState(cachedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(cachedEdges);
  const [modalOpen, setModalOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    setNodes(cachedNodes);
  }, [cachedNodes, setNodes]);
  useEffect(() => {
    setEdges(cachedEdges);
  }, [cachedEdges, setEdges]);

  const getCount = () => {
    setCount((prev) => prev + 1);
    return count;
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = { ...connection, type: "labeld-edge" };
      setEdges((eds) => addEdge(edge, eds));
      setEdgeStorage((eds) => addEdge(edge, eds));
    },
    [setEdges, setEdgeStorage],
  );

  const nodeTypes = useMemo(() => ({ order: OrderNode }), []);
  const edgeTypes = useMemo(() => ({ "labeld-edge": LabeledEdge }), []);

  const [select, setSelect] = useState<Order>(orderList[0]);

  return (
    <Layout>
      <Grid
        container
        direction={"row"}
        alignItems={"center"}
        sx={{ height: "10vh" }}
      >
        <Stack direction={"row"} display={"flex"}>
          <Stack direction={"row"}>
            <Autocomplete
              disablePortal
              options={orderList
                .filter((order) => order.payed)
                .map((order) => order.name)}
              sx={{ width: 250 }}
              renderInput={(params) => (
                <TextField {...params} label="Select Order" />
              )}
              onChange={(_, value) => {
                if (value) {
                  // biome-ignore lint/style/noNonNullAssertion: should be fine
                  setSelect(orderList.find((order) => order.name === value)!);
                }
              }}
            />
            <IconButton
              onClick={() => {
                const newNodes = [
                  ...nodes,
                  {
                    id: getCount().toString(),
                    type: "order",
                    position: { x: 100, y: 100 },
                    data: {
                      order: select,
                    },
                  },
                ];
                setNodeStorage(newNodes);
                setNodes(newNodes);
              }}
            >
              <Add />
            </IconButton>
          </Stack>
          <Stack
            direction={"row"}
            position={"absolute"}
            right={100}
            onClick={() => setModalOpen(true)}
          >
            <Button>{"how to use"}</Button>
          </Stack>
        </Stack>
      </Grid>
      <Divider />
      <div
        style={{
          width: "85vw",
          height: "80vh",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            setNodeStorage((prev) => {
              for (const change of changes) {
                if (change.type === "remove") {
                  const idx = prev.findIndex((n) => n.id === change.id);
                  prev.splice(idx, 1);
                }
              }
              return prev;
            });
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            setEdgeStorage((prev) => {
              for (const change of changes) {
                if (change.type === "remove") {
                  const idx = prev.findIndex((e) => e.id === change.id);
                  prev.splice(idx, 1);
                }
              }
              return prev;
            });
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onConnect={onConnect}
          onNodeDragStop={(_, node) => {
            setNodeStorage((prev) => {
              const idx = prev.findIndex((n) => n.id === node.id);
              prev[idx] = node;
              return prev;
            });
          }}
        >
          <Background color="grey" variant={BackgroundVariant.Dots} />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            id={`modal-modal-title-${id}`}
            variant="h6"
            component="h2"
          >
            Flowchart の使い方
          </Typography>
          {[
            "1. オーダーを選択して追加ボタンを押す",
            "2. ノードをドラッグして移動",
            "3. ノードのハンドルをドラッグしてエッジを作成",
            "4. ノードまたはエッジをクリックして Backspace を押すと削除",
            "5. ノードまたはエッジを右クリックすると編集メニューが表示",
          ].map((text) => (
            <Typography key={text} sx={{ mt: 2 }}>
              {text}
            </Typography>
          ))}
        </Box>
      </Modal>
    </Layout>
  );
}
