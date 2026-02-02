import { Box, ListItem, ListItemText, Stack, Typography, useMediaQuery, useTheme, IconButton, List, } from "@mui/material";


import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from '@mui/icons-material/Close';

import { useState } from "react";

const navItems = ["Today", "This Week", "This Month", "This Year"];

const Top = () => {
    const [active, setActive] = useState("Today");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));
    const isMobile = useMediaQuery('(max-width:450px)');
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            px={1}
            gap={2}
        >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Manager Dashboard
            </Typography>

            {isSmall ? (
                <>
                    {/* button NavBar */}
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        sx={{
                            transition: "all 0.3s ease",
                            transform: drawerOpen ? "rotate(180deg)" : "rotate(0deg)",
                            position: "relative",
                            zIndex: 1001,
                        }}
                    >
                        {drawerOpen ? <CloseIcon /> : <MenuIcon />}
                    </IconButton>

                    {/* <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                > */}

                    {drawerOpen && (
                        <>
                            <Box
                                onClick={() => setDrawerOpen(false)}
                                sx={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: "100vw",
                                    height: "100vh",
                                    // bgcolor: "rgba(10, 0, 0, 0.49)", // خلفية شبه شفافة
                                    zIndex: 999,
                                }}
                            />

                            <Box position={"absolute"} sx={{
                                width: isMobile ? 250 : 320,
                                height: '240px',
                                top: 60,
                                right: 30,
                                px: 2,
                                backgroundColor: theme.palette.background.paper,
                                boxShadow: theme.shadows[8],
                                borderRadius: 2,
                                zIndex: 1000,
                            }} >

                                <List >
                                    {navItems.map((item) => {
                                        const isActive = active === item;
                                        return (
                                            <ListItem
                                                key={item}
                                                button
                                                onClick={() => {
                                                    setActive(item);
                                                    setDrawerOpen(false); // close drawer on click
                                                }}
                                                sx={{
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    backgroundColor: isActive ? "#0088FF" : "transparent",
                                                    color: isActive ? "#fff" : theme.palette.text.DarkText,
                                                    "&:hover": { backgroundColor: isActive ? "#0058a5" : "" },
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <ListItemText
                                                    primary={item}
                                                    primaryTypographyProps={{
                                                        fontWeight: 500,
                                                    }}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        </>
                    )
                    }

                    {/* </Drawer> */}
                </>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#82828293",
                        px: 1,
                        py: 0.5,
                        borderRadius: 4,
                        gap: 3,
                    }}
                >
                    {navItems.map((item) => {
                        const isActive = active === item;
                        return (
                            <ListItem
                                key={item}
                                onClick={() => setActive(item)}
                                sx={{
                                    py: 0.5,
                                    px: 2,
                                    width: "auto",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    backgroundColor: isActive ? "#0088FF" : "transparent",
                                    color: isActive ? "#fff" : "#0000009f",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        backgroundColor: isActive ? "#0088FF" : "#7b7b7b",
                                        color: "#fff",
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={item}
                                    primaryTypographyProps={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </Box>
            )}
        </Stack>
    )
}

export default Top