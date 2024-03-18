"use client";
import { Layout } from "@/component/Dashboard";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  ListItem,
  Switch,
} from "@mui/material";
import Image from "next/image";
import Divider from "@mui/material/Divider";
import {
  Add,
  FilterAlt,
  Remove,
  SearchOutlined,
  ShareOutlined,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { useAtom } from "jotai";
import {
  deckAtom,
  filteredMemoriaAtom,
  legendaryDeckAtom,
  Memoria,
  roleFilterAtom,
  swAtom,
} from "@/jotai/atom";
import Filter from "@/component/Filter";
import { useEffect, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Search from "@/component/Search";
import Details from "@/component/Details";
import { decodeDeck, encodeDeck } from "@/actions/encodeDeck";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface DeckProps {
  legendaryDeck: Memoria[];
  deck: Memoria[];
}

function MemoriaItem({ name, id }: { name: string; id: string }) {
  const [_, setDeck] = useAtom(deckAtom);
  const [__, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [concentration, setConcentration] = useState(4);

  const handleConcentration = () => {
    if (concentration > 0) {
      setConcentration(concentration - 1);
    } else {
      setConcentration(4);
    }
    setDeck((prev) => {
      return prev.map((memoria) => {
        if (memoria.name === name) {
          return { ...memoria, concentration: concentration };
        }
        return memoria;
      });
    });
    setLegendaryDeck((prev) => {
      return prev.map((memoria) => {
        if (memoria.name === name) {
          return { ...memoria, concentration: concentration };
        }
        return memoria;
      });
    });
  };

  return (
    <ImageListItem key={id}>
      <Image src={`/memoria/${name}.png`} alt={name} width={100} height={100} />
      <ImageListItemBar
        sx={{ bgcolor: "rgba(0, 0, 0, 0)" }}
        position={"top"}
        actionPosition={"right"}
        actionIcon={
          <IconButton
            aria-label={`remove ${name}`}
            onClick={handleConcentration}
            sx={{
              marginTop: 2,
              marginRight: 1,
            }}
          >
            {concentration == 4 ? (
              <Typography
                variant="body2"
                color="white"
                sx={{
                  position: "absolute",
                }}
              >
                MAX
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="white"
                sx={{
                  position: "absolute",
                }}
              >
                {concentration}
              </Typography>
            )}
            <Image
              src={"/Concentration.png"}
              alt={"concentration"}
              width={30}
              height={30}
            />
          </IconButton>
        }
      />
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
    <Grid container direction={"column"} alignItems={"center"}>
      <Typography variant="h4" gutterBottom>
        Deck List
      </Typography>
      <Container
        maxWidth="md"
        sx={{
          bgcolor: "grey",
          minHeight: 530,
          width: 620,
          paddingTop: 2,
          paddingBottom: 2,
        }}
      >
        {/* Legendary Deck Images */}
        <ImageList
          sx={{ width: 600, height: 100, flexDirection: "column" }}
          cols={5}
          rowHeight={100}
        >
          {legendaryDeck.map(({ name, id }) => {
            return <MemoriaItem name={name} id={id.toString()} key={id} />;
          })}
        </ImageList>
        <Divider sx={{ margin: 2 }} />
        {/* Deck Images */}
        <ImageList sx={{ width: 600 }} cols={5} rowHeight={100}>
          {deck.map(({ name, id }) => {
            return <MemoriaItem name={name} id={id.toString()} key={id} />;
          })}
        </ImageList>
      </Container>
    </Grid>
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
  const [memoria] = useAtom(filteredMemoriaAtom);
  return (
    <FixedSizeList
      height={700}
      width={450}
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
    <Grid container direction={"column"} alignItems={"center"}>
      <Typography variant="h4" gutterBottom>
        Memoria List
      </Typography>
      <Grid direction="row" spacing={2} width={400}>
        <ToggleButtons />
        <FilterModal />
        <SearchModal />
      </Grid>
      <VirtualizedList />
    </Grid>
  );
}

function ToggleButtons() {
  const [_, setDeck] = useAtom(deckAtom);
  const [__, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw, setSw] = useAtom(swAtom);
  const [___, setRoleFilter] = useAtom(roleFilterAtom);

  return (
    <FormControlLabel
      control={<Switch defaultChecked />}
      label="前衛 <=> 後衛"
      onChange={() => {
        if (sw === "shield") {
          setSw("sword");
          setRoleFilter([
            "normal_single",
            "normal_range",
            "special_single",
            "special_range",
          ]);
        } else {
          setSw("shield");
          setRoleFilter(["support", "interference", "recovery"]);
        }
        setDeck([]);
        setLegendaryDeck([]);
      }}
    />
  );
}

function FilterModal() {
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
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Filter
          </Typography>
          <Filter />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SearchModal() {
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
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Search
          </Typography>
          <Search />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function DeckBuilder() {
  const params = useSearchParams();
  const [deck, setDeck] = useAtom(deckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const value = params.get("deck");
  const pathname = usePathname();

  const shareHandler = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://mitama.io/${pathname}?deck=${encodeDeck(deck, legendaryDeck)}`,
      );
      alert("クリップボードに保存しました。");
    } catch (error) {
      alert("失敗しました。");
    }
  };

  useEffect(() => {
    if (value) {
      const { deck, legendaryDeck } = decodeDeck(value);
      setDeck(deck);
      setLegendaryDeck(legendaryDeck);
    }
  }, [setDeck, setLegendaryDeck, value]);

  return (
    <Layout>
      <Grid container direction={"row"} alignItems={"right"}>
        <Grid item xs={12}>
          {/* share button */}
          <Link
            href={`/deck-builder?deck=${encodeDeck(deck, legendaryDeck)}`}
            onClick={shareHandler}
          >
            <IconButton aria-label="share">
              <ShareOutlined />
            </IconButton>
          </Link>
        </Grid>
        <Grid
          container
          item
          spacing={2}
          xs={12}
          direction={"row"}
          alignItems={"left"}
        >
          <Grid item xs={12} md={4} lg={4}>
            <Grid container direction={"column"} alignItems={"center"}>
              {/* DeckDetail */}
              <Typography variant="h4" gutterBottom>
                Deck Details
              </Typography>
              <Details />
            </Grid>
          </Grid>
          <Grid item xs={12} md={8} lg={5}>
            <DeckList deck={deck} legendaryDeck={legendaryDeck} />
          </Grid>
          <Grid item xs={12} lg={3}>
            {/* Source */}
            <Source />
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
}
