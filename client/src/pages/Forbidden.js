import {AppBar, Box, CssBaseline, Toolbar, Typography} from "@mui/material";
import React from "react";

export default function Forbidden() {
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ width: "100%" }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Страница не найдена.
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar />
                <Typography sx={{ marginBottom: 2 }}>
                    Страница не найдена.
                </Typography>
            </Box>
        </Box>
    );
}