"use client";

import { type ReactNode, type SyntheticEvent, useState } from "react";
import { Box, Stack } from "@mui/system";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import { Adx, Costume, costumeList, Ex } from "@/domain/costume/costume";
import NotFound from "next/dist/client/components/builtin/not-found";
import { Lenz } from "@/domain/lenz";
import Info from "@/components/data/Info";
import { match } from "ts-pattern";
import { option } from "fp-ts";
import Link from "@/components/link";
import { isSome } from "fp-ts/lib/Option";
import { CostumeIcon } from "@/components/image/CostumeIcon";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
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
    <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }} variant="outlined">
      <Table aria-label="status table" size="small" sx={{ minWidth: 500 }}>
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
            <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">
                {`Level ${index}`}
              </TableCell>
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <TableCell key={`${index}=>${value}`} align="right">
                  {row
                    .filter(
                      (skill) => skill.jobSkillType === value || skill.jobSkillType === value + 6,
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
            <TableCell component="th" scope="row" sx={{ color: "primary.contrastText" }}>
              {"共通"}
            </TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.common[0]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.common[1]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.common[2]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.common[3]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.common[4]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{rate}</TableCell>
          </TableRow>
          <TableRow
            sx={{
              "&:last-child td, &:last-child th": { border: 0 },
              bgcolor: "primary.main",
            }}
          >
            <TableCell component="th" scope="row" sx={{ color: "primary.contrastText" }}>
              {"固有"}
            </TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}></TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.particular[0]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.particular[1]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.particular[2]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}>{summary.particular[3]}</TableCell>
            <TableCell align="right" sx={{ color: "primary.contrastText" }}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function RareSkill({ costume: { rareSkill } }: { costume: Costume }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
              {rareSkill.name}
            </Typography>
            {rareSkill.effectTime !== 0 && (
              <Chip
                label={`効果時間 ${rareSkill.effectTime}秒`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
            {rareSkill.description}
          </Typography>
          {rareSkill.note && (
            <Box sx={{ mt: 2 }}>
              <Info margin={0}>{rareSkill.note}</Info>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function Basic({ costume }: { costume: Costume }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 3,
        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        backdropFilter: "blur(10px)",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        width: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        sx={{ justifyContent: "flex-start", alignItems: { xs: "center", sm: "flex-start" } }}
      >
        <CostumeIcon costume={costume} size={120} />
        <Box sx={{ textAlign: { xs: "center", sm: "left" }, flexGrow: 1 }}>
          <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ justifyContent: { xs: "center", sm: "flex-start" }, display: "flex", mb: 1 }}>
            <Link underline="hover" color="inherit" href="/data">
              data
            </Link>
            <Link underline="hover" color="inherit" href="/data/costume">
              costume
            </Link>
            <Typography sx={{ color: "text.primary" }}>{costume.name}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: "bold" }} gutterBottom>
            {costume.name}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: { xs: "center", sm: "flex-start" }, mt: 2 }}>
            <Chip label={`${costume.cardType} / ${costume.rate}%`} size="small" variant="outlined" color="primary" />
            {isSome(costume.specialSkill) &&
              match(costume.specialSkill.value)
                .with({ type: "ex" }, () => <Chip label="EX" size="small" variant="outlined" color="secondary" />)
                .with({ type: "adx", awakable: false }, () => <Chip label="ADX" size="small" variant="outlined" color="secondary" />)
                .with({ type: "adx", awakable: true }, () => <Chip label="ADX/覚醒" size="small" variant="outlined" color="secondary" />)
                .exhaustive()}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

function AdxSkill({ adx: { get, awakable } }: { adx: Adx }) {
  const [value, setValue] = useState(3);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const [isAwakened, setIsAwakened] = useState(true);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" variant="scrollable" scrollButtons="auto">
          <Tab label="突破 0" {...a11yProps(0)} />
          <Tab label="突破 1" {...a11yProps(1)} />
          <Tab label="突破 2" {...a11yProps(2)} />
          <Tab label="突破 3" {...a11yProps(3)} />
        </Tabs>
      </Box>
      {awakable && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>覚醒</Typography>
          <Checkbox onChange={() => setIsAwakened(!isAwakened)} defaultChecked size="small" />
        </Box>
      )}
      {[0, 1, 2, 3].map((limitBreak) => {
        return (
          <CustomTabPanel key={`tab-${limitBreak}`} value={value} index={limitBreak}>
            <Stack spacing={2}>
              {get({ limitBreak, isAwakened }).map(({ name, description }) => {
                return (
                  <Card key={name} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
                        {name}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {description}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </CustomTabPanel>
        );
      })}
    </Box>
  );
}

function ExSkill({ ex }: { ex: Ex }) {
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {ex.skills.map((skill) => (
        <Card key={skill.name} variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
              {skill.name}
            </Typography>
            <Typography variant="body2" color="text.primary">
              {skill.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function SkillTabs({ specialSkill, costume }: { specialSkill: Adx | Ex; costume: Costume }) {
  const [value, setValue] = useState(0);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const label = match(specialSkill)
    .with({ type: "ex" }, () => "EXスキル")
    .with({ type: "adx" }, () => "ADXスキル")
    .exhaustive();

  return (
    <Box sx={{ width: "100%" }}>
      <Divider textAlign="left" sx={{ my: 3 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold" }}>詳細</Typography>
      </Divider>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" variant="scrollable" scrollButtons="auto">
          <Tab label={label} {...a11yProps(0)} sx={{ fontWeight: "bold" }} />
          <Tab label="ステータス" {...a11yProps(1)} sx={{ fontWeight: "bold" }} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        {match(specialSkill)
          .with({ type: "ex" }, (ex) => <ExSkill ex={ex} />)
          .with({ type: "adx" }, (adx) => <AdxSkill adx={adx} />)
          .exhaustive()}
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <StatusTable costume={costume} />
      </CustomTabPanel>
    </Box>
  );
}

function DetailData({ costume }: { costume: Costume }) {
  return (
    <Box sx={{ width: "100%" }}>
      {match(costume.specialSkill)
        .with(option.none, () => (
          <>
            <Divider textAlign="left" sx={{ my: 3 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold" }}>詳細</Typography>
            </Divider>
            <StatusTable costume={costume} />
          </>
        ))
        .with({ value: { type: "ex" } }, ({ value }) => (
          <SkillTabs specialSkill={value} costume={costume} />
        ))
        .with({ value: { type: "adx" } }, ({ value }) => (
          <SkillTabs specialSkill={value} costume={costume} />
        ))
        .exhaustive()}
    </Box>
  );
}

export default function Detail({ lily, job }: { lily: string; job: string }) {
  const costume = costumeList.find(
    (costume) => Lenz.costume.general.name.normalized.full.get(costume) === `${lily}/${job}`,
  );
  
  const [showStanding, setShowStanding] = useState(false);

  if (costume === undefined) return <NotFound />;

  return (
    <Box
      sx={{
        width: { xs: "100%", md: "90%", lg: "80%" },
        maxWidth: 1400,
        mx: "auto",
        p: { xs: 1, md: 3 },
        mt: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: { xs: 2, md: 4 },
      }}
    >
      <Basic costume={costume} />
      <Grid container={true} spacing={{ xs: 2, md: 4 }} sx={{ width: "100%" }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
          <Divider textAlign="left" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold" }}>レアスキル</Typography>
          </Divider>
          <RareSkill costume={costume} />
          <DetailData costume={costume} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 1, md: 2 }, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Button 
            variant="outlined" 
            onClick={() => setShowStanding(!showStanding)}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {showStanding ? "立ち絵を非表示" : "立ち絵を表示"}
          </Button>
          <Collapse in={showStanding} timeout="auto" unmountOnExit sx={{ width: "100%" }}>
            <Box sx={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: { xs: 300, md: 400 },
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              mx: "auto"
            }}>
              <Image
                src={`/costume/standing/${costume.uniqueId}.png`}
                alt={costume.name}
                width={750}
                height={1300}
                layout="responsive"
                priority={true}
                unoptimized
              />
            </Box>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
}

