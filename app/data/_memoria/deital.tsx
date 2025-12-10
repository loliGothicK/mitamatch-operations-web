"use client";

import { type ReactNode, type SyntheticEvent, useState } from "react";
import { type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { Box, Stack } from "@mui/system";
import Tabs from "@mui/material/Tabs";
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
import { AutoSkill } from "@/parser/autoSkill";
import { Skill } from "@/parser/skill";
import { projector } from "@/functional/proj";

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

export default function Deital({
  name,
  type,
}: {
  name: string;
  type?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}) {
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
              {data[0].labels.join("/")}
            </Box>
          </Stack>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            {data.map((memoria, index) => (
              <Tab key={memoria.cardType} label={memoria.cardType} {...a11yProps(index)} />
            ))}
          </Tabs>
        </Box>
        {data.map((memoria, index) => (
          <CustomTabPanel index={index} value={value} key={memoria.cardType}>
            <Box display={"flex"} flexDirection={"column"} alignItems={"center"}>
              <Divider flexItem={true} textAlign="left" sx={{ margin: 5 }}>
                ステータス
              </Divider>
              <StatusTable status={memoria.status} />
              <SkillCard skill={memoria.skills.questSkill} title={"対ヒュージスキル"} />
              <SkillCard skill={memoria.skills.gvgSkill} title={"レギオンマッチスキル"} />
              <SkillCard skill={memoria.skills.autoSkill} title={"レギオンマッチ補助スキル"} />
            </Box>
          </CustomTabPanel>
        ))}
      </Box>
  );
}

function SkillCard({ skill, title }: { skill: Skill | AutoSkill; title: string }) {
  return (
    <>
      <Divider flexItem={true} textAlign="left" sx={{ margin: 5 }}>
        {title}
      </Divider>
      <Card sx={{ width: "90%", margin: "auto" }} variant="outlined" square={true}>
        <CardContent>
          <Box display="flex" alignItems="flex-start">
            <Typography variant="h5" component="div" sx={{ margin: 2 }}>
              {skill.raw.name}
            </Typography>
            {"sp" in skill && (
              <Chip label={`消費MP ${skill.sp}`} sx={{ marginLeft: "auto", marginTop: 2 }} />
            )}
          </Box>
          <Divider sx={{ margin: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ margin: 2 }}>
            {skill.raw.description}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
