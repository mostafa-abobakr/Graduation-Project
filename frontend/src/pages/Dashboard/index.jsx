import { Box, ListItem, ListItemText, Stack, Typography, useMediaQuery, useTheme, IconButton, Drawer, List, Card, CardContent, Avatar, } from "@mui/material";

import Container from "../../components/common/Container/Container";

import { useState } from "react";
import Top from "./Top/Top";
import PieChartCard from "./PieChart/PieChart";
import TotalBalance from "./TotalBalance/TotalBalance";
import LineChartDaily from "./LineChartDaily/LineChartDaily";
import BestDishes from "./BestDishes/BestDishes";



const Dashboard = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Container>
      {/* NavBar */}
      <Top />

      <Stack direction={isSmall ? "column" : "row"} gap={3} >
        <PieChartCard />
        <TotalBalance />
      </Stack>

      <Stack direction={isSmall ? "column" : "row"} gap={3} mt={2}>
        <LineChartDaily />
        <BestDishes />
      </Stack>

    </Container>
  );
};

export default Dashboard;