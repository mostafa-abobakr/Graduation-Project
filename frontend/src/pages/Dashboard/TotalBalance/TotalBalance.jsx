
import { Box, Stack, Typography, Card, CardContent, Avatar, useTheme, useMediaQuery, } from "@mui/material";

import Title from "../../../components/common/Title/Title";

import BarChartIcon from "@mui/icons-material/BarChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";



const Balance_Data = {
    totalBalance: 120000,
    income: {
        value: 45500,
        increase: 60,
    },
    expense: {
        value: 65500,
        increase: 70,
    },
};

const TotalBalance = () => {

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));
    const isMobile = useMediaQuery('(max-width:450px)');

    return (
        <Card sx={{ width: isSmall ? "100%" : '50%', borderRadius: 3 }}>
            <CardContent>
                <Title fontWeight={"bold"} title={"Total Balance"} />
                <Box sx={{ textAlign: "center" }} >
                    <Typography fontWeight={800} fontSize={45} color="#0088FF" py={4}> ${Balance_Data.totalBalance.toLocaleString()} </Typography>
                </Box>

                {/* Income */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" my={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: "black" }}>
                            <BarChartIcon />
                        </Avatar>

                        <Box>
                            <Typography fontWeight={600} fontSize={isMobile ? 13 : 14}>Total Income</Typography>
                            <Typography fontSize={isMobile ? 12 : 14} color="text.secondary">
                                ${Balance_Data.income.value.toLocaleString()}
                            </Typography>
                        </Box>
                    </Stack>

                    <Typography fontSize={isMobile ? 12 : 14} color="text.secondary">
                        (+{Balance_Data.income.increase}% Increase)
                    </Typography>
                </Stack>

                {/* Expense */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: "#0088FF" }}>
                            <AccountBalanceWalletIcon />
                        </Avatar>

                        <Box>
                            <Typography fontWeight={600} fontSize={isMobile ? 13 : 14}>Total Expense</Typography>
                            <Typography fontSize={isMobile ? 12 : 14} color="text.secondary">
                                ${Balance_Data.expense.value.toLocaleString()}
                            </Typography>
                        </Box>
                    </Stack>

                    <Typography fontSize={isMobile ? 12 : 14} color="text.secondary">
                        (+{Balance_Data.expense.increase}% Increase)
                    </Typography>
                </Stack>

            </CardContent>
        </Card>
    )
}

export default TotalBalance