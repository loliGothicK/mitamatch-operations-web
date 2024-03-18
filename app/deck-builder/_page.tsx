"use client";
import { Layout } from "@/component/Dashboard";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  ListItem,
  Modal,
  Switch,
} from "@mui/material";
import Image from "next/image";
import Divider from "@mui/material/Divider";
import { Add, FilterAlt, Remove, SearchOutlined } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { useAtom } from "jotai";
import {
  Memoria,
  deckAtom,
  legendaryDeckAtom,
  filteredMemoriaAtom,
  swAtom,
} from "@/jotai/atom";
import Filter from "@/component/Filter";
import { useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Search from "@/component/Search";
import Details from "@/component/Details";

interface DeckProps {
  legendaryDeck: Memoria[];
  deck: Memoria[];
}

function MemoriaItem({ name, id }: { name: string; id: string }) {
  const [_, setDeck] = useAtom(deckAtom);
  const [__, setLegendaryDeck] = useAtom(legendaryDeckAtom);

  return (
    <ImageListItem key={id}>
      <Image src={`/memoria/${name}.png`} alt={name} width={100} height={100} />
      <ImageListItemBar
        sx={{ bgcolor: "rgba(0, 0, 0, 0)" }}
        position={"top"}
        actionPosition={"left"}
        actionIcon={
          <IconButton
            sx={{
              color: "rgba(255, 50, 50, 0.9)",
              bgcolor: "rgba(0, 0, 0, 0.2)",
            }}
            aria-label={`remove ${name}`}
            onClick={() => {
              setDeck((prev) =>
                prev.filter((memoria) => memoria.name !== name),
              );
              setLegendaryDeck((prev) =>
                prev.filter((memoria) => memoria.name !== name),
              );
            }}
          >
            <Remove />
          </IconButton>
        }
      />
    </ImageListItem>
  );
}

function DeckList({ legendaryDeck, deck }: DeckProps) {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Deck List
      </Typography>
      <Container
        maxWidth="lg"
        sx={{
          bgcolor: "grey",
          minHeight: "60vh",
          paddingTop: 2,
          paddingBottom: 2,
        }}
      >
        {/* Legendary Deck Images */}
        <ImageList sx={{ width: 600, height: 100 }} cols={5} rowHeight={100}>
          {legendaryDeck.map(({ name, id }) => {
            return <MemoriaItem name={name} id={id.toString()} key={id} />;
          })}
        </ImageList>
        <Divider sx={{ margin: 2 }} />
        {/* Deck Images */}
        <ImageList sx={{ width: 600, height: 520 }} cols={5} rowHeight={100}>
          {deck.map(({ name, id }) => {
            return <MemoriaItem name={name} id={id.toString()} key={id} />;
          })}
        </ImageList>
      </Container>
    </>
  );
}

function renderRow(props: ListChildComponentProps) {
  const { index, style } = props;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [memoria] = useAtom(filteredMemoriaAtom);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [_, setDeck] = useAtom(deckAtom);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [__, setLegendaryDeck] = useAtom(legendaryDeckAtom);

  return (
    <ListItem
      key={index}
      style={style}
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="comments"
          onClick={() => {
            if (memoria[index].labels.includes("legendary")) {
              setLegendaryDeck((prev) => [...prev, memoria[index]]);
            } else {
              setDeck((prev) => [...prev, memoria[index]]);
            }
          }}
        >
          <Add />
        </IconButton>
      }
      disablePadding
      sx={{ bgcolor: "grey" }}
    >
      <ListItemButton role={undefined} dense>
        <ListItemIcon>
          <Image
            src={`/memoria/${memoria[index].name}.png`}
            alt={memoria[index].name}
            width={100}
            height={100}
          />
        </ListItemIcon>
        <ListItemText
          secondary={
            <>
              <Typography
                component="span"
                variant="body1"
                fontWeight="bold"
                sx={{ display: "block" }}
                color="text.primary"
              >
                {memoria[index].skill.name}
              </Typography>
              <Divider sx={{ margin: 1 }} />
              <Typography
                component="span"
                fontWeight="bold"
                variant="body1"
                sx={{ display: "block" }}
                color="text.primary"
              >
                {memoria[index].support.name}
              </Typography>
            </>
          }
          sx={{
            marginLeft: 2,
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

function VirtualizedList() {
  const [memoria, _] = useAtom(filteredMemoriaAtom);
  return (
    <FixedSizeList
      height={700}
      width={500}
      itemSize={100}
      itemCount={memoria.length}
      overscanCount={5}
    >
      {renderRow}
    </FixedSizeList>
  );
}
function Source() {
  return (
    <Box sx={{ width: "100%", height: "70vh", maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Memoria List
      </Typography>
      <Grid direction="row" spacing={2} width={400}>
        <ToggleButtons />
        <FilterModal />
        <SearchModal />
      </Grid>
      <VirtualizedList />
    </Box>
  );
}

function ToggleButtons() {
  const [_, setDeck] = useAtom(deckAtom);
  const [__, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw, setSw] = useAtom(swAtom);

  return (
    <FormControlLabel
      control={<Switch defaultChecked />}
      label="前衛 <=> 後衛"
      onChange={() => {
        if (sw === "shield") {
          setSw("sword");
        } else {
          setSw("shield");
        }
        setDeck([]);
        setLegendaryDeck([]);
      }}
    />
  );
}

function FilterModal() {
  const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "midnightblue",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>
        <FilterAlt />
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Filters
          </Typography>
          <Filter />
        </Box>
      </Modal>
    </>
  );
}

function SearchModal() {
  const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "midnightblue",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>
        <SearchOutlined />
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Search
          </Typography>
          <Search />
        </Box>
      </Modal>
    </>
  );
}

export default function DeckBuilder() {
  const [deck, _] = useAtom(deckAtom);
  const [legendaryDeck, __] = useAtom(legendaryDeckAtom);

  return (
    <Layout>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} lg={4}>
          {/* DeckDetail */}
          <Typography variant="h6" gutterBottom>
            Deck Details
          </Typography>
          <Details />
        </Grid>
        <Grid item xs={12} md={8} lg={5}>
          <DeckList deck={deck} legendaryDeck={legendaryDeck} />
        </Grid>
        <Grid item xs={12} lg={3}>
          {/* Source */}
          <Source />
        </Grid>
      </Grid>
    </Layout>
  );
}
