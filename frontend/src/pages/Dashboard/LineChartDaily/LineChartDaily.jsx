import React from 'react'
import { useMediaQuery, useTheme, Card, CardContent, } from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";
import Title from "../../../components/common/Title/Title";


const dailySellingData = [20000, 15000, 14500, 13000, 12500, 13500, 15500, 14000, 13000, 14500, 15500, 15000, 10000];

const LineChartDaily = () => {

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));
    const isMobile = useMediaQuery('(max-width:450px)');

    return (
        <Card sx={{ width: isSmall ? "100%" : "60%", borderRadius: 3 }}>
            <CardContent sx={{ p: isMobile ? 1 : 2 }} >
                <Title title="Daily Selling" fontWeight={600} sx={{ mb: 1 }} />

                <LineChart
                    xAxis={[{ scaleType: "point", data: dailySellingData.map((_, i) => i + 1) }]}
                    yAxis={[{ min: 5000, max: 20000, tickNumber: 4 },]}
                    series={[
                        {
                            data: dailySellingData,
                            area: true,
                            color: "#1976d2",
                            showMark: false,
                            curve: "monotoneX",
                        },
                    ]}
                    axisHighlight={{
                        x: 'line',
                        y: 'none',
                    }}
                    height={250}
                    slotProps={{
                        tooltip: {
                            sx: {
                                backgroundColor: "#0b1220",
                                color: theme.palette.primary.DarkText,
                                "& *": { color: theme.palette.primary.DarkText, },
                            },
                        },
                    }}
                    grid={{ horizontal: true, vertical: false }}
                    sx={{
                        ".MuiAreaElement-root": { opacity: 0.2, },
                        ".MuiChartsAxis-line": { display: "none", },
                        ".MuiChartsAxis-tick": { display: "none", },
                        ".MuiChartsGrid-line": { stroke: "#e0e0e0", },
                        ".MuiChartsAxis-bottom": { display: "none", },
                    }}
                />

            </CardContent>
        </Card>
    )
}

export default LineChartDaily