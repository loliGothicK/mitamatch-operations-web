"use client";

import { type SyntheticEvent, useState } from "react";
import { formatCardType, type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { Box, Stack } from "@mui/system";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import {
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { projector } from "@/functional/proj";
import TabList from "@mui/lab/TabList";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import { MemoriaIcon } from "@/components/image/MemoriaIcon";

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function StatusTable({ status }: { status: Memoria["status"] }) {
  return (
    <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }} variant="outlined">
      <Table aria-label="status table" size="small" sx={{ minWidth: 400 }}>
        <TableHead>
          <TableRow>
            <TableCell>レベル</TableCell>
            <TableCell align="right">ATK</TableCell>
            <TableCell align="right">Sp.ATK</TableCell>
            <TableCell align="right">DEF</TableCell>
            <TableCell align="right">Sp.DEF</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {status.map((row, index) => (
            <TableRow
              key={row.join(",")}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {80 + index * 10}
              </TableCell>
              {row.map((value) => (
                <TableCell key={value} align="right">
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Detail({ name, type }: { name: string; type?: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
  const data = memoriaList.filter((memoria) => memoria.name.full === decodeURI(name));
  const indices = data.map(projector("cardType"));
  const [value, setValue] = useState(type ? indices.findIndex((_) => _ === type) : 0);

  const handleChange = (_: SyntheticEvent, newValue: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", md: "80%" },
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 1, md: 3 },
        mt: { xs: 2, md: 4 },
      }}
    >
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
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ justifyContent: "flex-start", alignItems: { xs: "center", sm: "flex-start" } }}
        >
          <MemoriaIcon memoria={data[0]} size={120} />
          <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
            <Typography variant="h4" sx={{ fontWeight: "bold" }} gutterBottom>
              {data[0].name.full}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: { xs: "center", sm: "flex-start" } }}>
              {data[0].labels.map((label) => (
                <Chip key={label} label={label} size="small" variant="outlined" color="primary" />
              ))}
            </Box>
          </Box>
        </Stack>
      </Paper>
      <TabContext value={value}>
        <TabList
          onChange={handleChange}
          aria-label="tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 2,
          }}
        >
          {data.map((memoria, index) => (
            <Tab
              key={memoria.cardType}
              label={formatCardType(memoria.cardType)}
              {...a11yProps(index)}
              sx={{ fontWeight: "bold" }}
            />
          ))}
        </TabList>
        {data.map((memoria, index) => (
          <TabPanel key={memoria.id} value={index} sx={{ p: { xs: 0, md: 3 } }}>
            <Stack spacing={3}>
              <SkillCard skill={memoria.skills.gvgSkill.raw} title={"レギオンマッチスキル"} />
              <SkillCard skill={memoria.skills.autoSkill.raw} title={"レギオンマッチ補助スキル"} />
              {memoria.skills.legendary !== undefined && (
                <SkillCard skill={memoria.skills.legendary.raw[4]} title={"レジェンダリースキル"} />
              )}
              <SkillCard skill={memoria.skills.questSkill.raw} title={"対ヒュージスキル"} />
              
              <Box sx={{ mt: 2 }}>
                <Divider textAlign="left" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold" }}>ステータス</Typography>
                </Divider>
                <StatusTable status={memoria.status} />
              </Box>
            </Stack>
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
}

function SkillCard({
  skill,
  title,
}: {
  skill: { readonly name: string; readonly description: string };
  title: string;
}) {
  return (
    <Box>
      <Divider textAlign="left" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>{title}</Typography>
      </Divider>
      <Card variant="outlined" sx={{ width: "100%", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
              {skill.name}
            </Typography>
            {"sp" in skill && (
              <Chip
                label={`MP ${String(skill.sp)}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
            {skill.description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
