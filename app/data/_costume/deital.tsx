"use client";

import { Layout } from "@/components/Layout";
import { type ReactNode, type SyntheticEvent, useState } from "react";
import { Box } from "@mui/system";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Costume, costumeList } from "@/domain/costume/costume";
import NotFound from "next/dist/client/components/builtin/not-found";
import { Lenz } from "@/domain/lenz";
import Info from "@/components/data/Info";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function StatusTable({
  costume: {
    rate,
    cardType,
    status: { raw, summary },
  },
}: {
  costume: Costume;
}) {
  return (
    <TableContainer component={Paper} sx={{ width: "90%" }}>
      <Table aria-label="status table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>レベル</TableCell>
            <TableCell align="right">HP</TableCell>
            <TableCell align="right">ATK</TableCell>
            <TableCell align="right">Sp.ATK</TableCell>
            <TableCell align="right">DEF</TableCell>
            <TableCell align="right">Sp.DEF</TableCell>
            <TableCell align="right">{`${cardType} (%)`}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {raw.map((row, index) => (
            <TableRow
              key={index}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {`Level ${index}`}
              </TableCell>
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <TableCell key={`${index}=>${value}`} align="right">
                  {row
                    .filter(
                      (skill) =>
                        skill.jobSkillType === value ||
                        skill.jobSkillType === value + 6,
                    )
                    .reduce((acc, skill) => acc + skill.value, 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow
            sx={{
              "&:last-child td, &:last-child th": { border: 0 },
              bgcolor: "primary.main",
            }}
          >
            <TableCell component="th" scope="row">
              {"共通"}
            </TableCell>
            <TableCell align="right">{summary.common[0]}</TableCell>
            <TableCell align="right">{summary.common[1]}</TableCell>
            <TableCell align="right">{summary.common[2]}</TableCell>
            <TableCell align="right">{summary.common[3]}</TableCell>
            <TableCell align="right">{summary.common[4]}</TableCell>
            <TableCell align="right">{rate}</TableCell>
          </TableRow>
          <TableRow
            sx={{
              "&:last-child td, &:last-child th": { border: 0 },
              bgcolor: "primary.main",
            }}
          >
            <TableCell component="th" scope="row">
              {"固有"}
            </TableCell>
            <TableCell align="right"></TableCell>
            <TableCell align="right">{summary.particular[0]}</TableCell>
            <TableCell align="right">{summary.particular[1]}</TableCell>
            <TableCell align="right">{summary.particular[2]}</TableCell>
            <TableCell align="right">{summary.particular[3]}</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function RareSkill({ costume: { rareSkill } }: { costume: Costume }) {
  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <Card sx={{ margin: "auto" }} variant="outlined" square={true}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" sx={{ margin: 2 }}>
            <Typography variant="h5" component="div" sx={{ margin: 2 }}>
              {rareSkill.name}
            </Typography>
            {rareSkill.effectTime !== 0 && (
              <Chip
                label={`効果時間 ${rareSkill.effectTime}秒`}
                sx={{ marginLeft: "auto", marginTop: 2 }}
              />
            )}
          </Box>
          <Divider sx={{ margin: 2 }} />
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ margin: 2 }}
          >
            {rareSkill.description}
          </Typography>
          {rareSkill.note && <Info margin={2}>{rareSkill.note}</Info>}
        </CardContent>
      </Card>
    </Box>
  );
}

function Basic({ costume }: { costume: Costume }) {
  return (
    <Card sx={{ display: "flex", width: "100%" }}>
      <CardMedia
        component="img"
        sx={{ width: 150 }}
        image={`/costume/icon/${Lenz.costume.general.name.lily.get(costume)}/${Lenz.costume.general.name.job.get(costume)}.jpg`}
        alt="Live from space album cover"
      />
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <CardContent sx={{ flex: "1 0 auto" }}>
          <Typography component="div" variant="h5">
            {costume.name}
          </Typography>
          <Chip
            label={costume.cardType}
            sx={{ marginLeft: "auto", marginTop: 2 }}
          />
        </CardContent>
      </Box>
    </Card>
  );
}

export default function Deital({ lily, job }: { lily: string; job: string }) {
  const [value, setValue] = useState(0);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const costume = costumeList.find(
    (costume) => costume.name === `${lily}/${job}`,
  );

  if (costume === undefined) return <NotFound />;

  return (
    <Layout>
      <Box
        sx={{
          width: "80%",
          mx: "auto",
          p: 3,
          mt: 4,
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        <Basic costume={costume} />
        <Grid container={true} spacing={2}>
          <Grid size={8}>
            <Divider flexItem={true} textAlign="left" sx={{ py: 2 }}>
              {"レアスキル"}
            </Divider>
            <RareSkill costume={costume} />
            <Box
              sx={{
                width: "100%",
              }}
            >
              <Divider flexItem={true} textAlign="left" sx={{ py: 2 }}>
                {"詳細"}
              </Divider>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={value}
                  onChange={handleChange}
                  aria-label="basic tabs example"
                >
                  <Tab label="スキル的なもの" {...a11yProps(0)} />
                  <Tab label="ステータス的なもの" {...a11yProps(1)} />
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                Item One
              </CustomTabPanel>
              <CustomTabPanel value={value} index={1}>
                <StatusTable costume={costume} />
              </CustomTabPanel>
            </Box>
          </Grid>
          <Grid size={4}>
            <Image
              src={`/costume/full/${lily}/${job}.png`}
              alt={`${lily}/${job}`}
              width={750}
              height={1300}
              priority={true}
            />
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
