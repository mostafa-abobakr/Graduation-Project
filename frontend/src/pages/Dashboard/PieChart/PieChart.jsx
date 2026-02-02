import React from 'react'
import { Box, Stack, Typography, Card, CardContent, useMediaQuery, useTheme, } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import Title from '../../../components/common/Title/Title';



const data = [
    { id: 0, value: 30000, label: "Food", color: "#1976d2" },
    { id: 1, value: 25000, label: "Cold Drink", color: "#000000" },
    { id: 2, value: 25000, label: "Others", color: "#e0e0e0" }
];
const PieChartCard = () => {

    //  Cors

    const theme = useTheme(); // Dark & Light & useMediaQuery
    const isSmall = useMediaQuery(theme.breakpoints.down("md")); // under 900px

    return (
        <Card sx={{ width: isSmall ? "100%" : '50%', borderRadius: 3 }}>
            <CardContent>

                <Title fontWeight={600} title={"Total Income"} />

                <Box position="relative" display="flex" justifyContent="center" alignItems={"center"} >
                    <PieChart
                        series={[
                            {
                                data,
                                innerRadius: 70,
                                outerRadius: 100,
                                paddingAngle: 2,
                            }
                        ]}
                        width={250}
                        height={220}
                        hideLegend
                    />

                    {/* Center Text */}
                    <Box position="absolute" top="50%" left="50%" sx={{ transform: "translate(-50%, -50%)" }} >
                        <Typography fontWeight={700} fontSize={18}> $80,000 </Typography>
                    </Box>
                </Box>

                {/* Legend */}
                <Stack direction="row" justifyContent="space-around" mt={2}>
                    {data.map((item) => (
                        <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: item.color
                                }}
                            />
                            <Typography variant="body2">{item.label}</Typography>
                        </Stack>
                    ))}
                </Stack>

            </CardContent>
        </Card>
    )
}

export default PieChartCard;