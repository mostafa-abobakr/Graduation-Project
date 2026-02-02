import { Box, Stack, Typography, useMediaQuery, useTheme, Card, CardContent, Avatar, } from "@mui/material";
import Title from "../../../components/common/Title/Title";

const bestDishes = [
    { id: 1, name: "chicken burger", price: 30, orders: 500, img: "https://source.unsplash.com/60x60/?burger" },
    { id: 2, name: "cheese burger", price: 20, orders: 800, img: "https://source.unsplash.com/60x60/?cheeseburger" },
    { id: 3, name: "double burger", price: 50, orders: 950, img: "https://source.unsplash.com/60x60/?hamburger" },
    { id: 4, name: "chicken nuggets", price: 30, orders: 700, img: "https://source.unsplash.com/60x60/?nuggets" }
];


const BestDishes = () => {

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Card sx={{ width: isSmall ? "100%" : "40%", borderRadius: 3 }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Title fontWeight={600}>Best Dishes</Title>
                    <Typography fontSize={14} color="text.secondary"> Orders </Typography>
                </Stack>

                <Stack spacing={2}>
                    {bestDishes.map((item) => (
                        <Stack
                            key={item.id}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    src={item.img}
                                    variant="rounded"
                                    sx={{ width: 50, height: 50 }}
                                />

                                <Box>
                                    <Typography fontWeight={600} fontSize={14}>
                                        {item.name}
                                    </Typography>
                                    <Typography fontSize={12} color="text.secondary">
                                        ${item.price}.00
                                    </Typography>
                                </Box>
                            </Stack>

                            <Typography fontWeight={600} color="text.secondary">
                                {item.orders}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    )
}

export default BestDishes