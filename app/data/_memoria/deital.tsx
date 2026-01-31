"use client";

import { type SyntheticEvent, useState } from "react";
import { formatCardType, type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { Box, Stack } from "@mui/system";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Image from "next/image";
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

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function StatusTable({ status }: { status: Memoria["status"] }) {
  return (
    <TableContainer component={Paper} sx={{ width: "90%" }}>
      <Table aria-label="status table" size="small">
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

export default function Deital({ name, type }: { name: string; type?: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
  const data = memoriaList.filter((memoria) => memoria.name.full === decodeURI(name));
  const indices = data.map(projector("cardType"));
  const [value, setValue] = useState(type ? indices.findIndex((_) => _ === type) : 0);

  const handleChange = (_: SyntheticEvent, newValue: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        width: "80%",
        mx: "auto",
        p: 3,
        mt: 4,
        borderRadius: 1,
      }}
    >
      <Box>
        <Stack direction={"row"} justifyContent={"left"} alignItems={"center"} gap={2}>
          <Image
            src={`/memoria/${data[0].name.short}.png`}
            alt={data[0].name.short}
            width={120}
            height={120}
            priority={true}
          />
          <Box>
            <Typography variant="h4" component="div">
              {data[0].name.full}
            </Typography>
            {data[0].labels.map((label) => {
              return <Chip key={label} label={label} sx={{ margin: 1 }} />;
            })}
          </Box>
        </Stack>
      </Box>
      <TabContext value={value}>
        <TabList
          onChange={handleChange}
          aria-label="tabs"
          sx={{
            margin: 2,
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          {data.map((memoria, index) => (
            <Tab
              key={memoria.cardType}
              label={formatCardType(memoria.cardType)}
              {...a11yProps(index)}
            />
          ))}
        </TabList>
        {data.map((memoria, index) => (
          <TabPanel key={memoria.id} value={index} sx={{ padding: 0 }}>
            <Box display={"flex"} flexDirection={"column"} alignItems={"center"}>
              <SkillCard skill={memoria.skills.gvgSkill.raw} title={"レギオンマッチスキル"} />
              <SkillCard skill={memoria.skills.autoSkill.raw} title={"レギオンマッチ補助スキル"} />
              {memoria.skills.legendary !== undefined && (
                <SkillCard skill={memoria.skills.legendary.raw[4]} title={"レジェンダリースキル"} />
              )}
              <SkillCard skill={memoria.skills.questSkill.raw} title={"対ヒュージスキル"} />
              <Divider flexItem={true} textAlign="left" sx={{ margin: 5 }}>
                ステータス
              </Divider>
              <StatusTable status={memoria.status} />
            </Box>
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
    <>
      <Divider flexItem={true} textAlign="left" sx={{ margin: 5 }}>
        {title}
      </Divider>
      <Card sx={{ width: "90%", margin: "auto" }} variant="outlined" square={true}>
        <CardContent>
          <Box display="flex" alignItems="flex-start">
            <Typography variant="h5" component="div" sx={{ margin: 2 }}>
              {skill.name}
            </Typography>
            {"sp" in skill && (
              <Chip label={`消費MP ${skill.sp}`} sx={{ marginLeft: "auto", marginTop: 2 }} />
            )}
          </Box>
          <Divider sx={{ margin: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ margin: 2 }}>
            {skill.description}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
