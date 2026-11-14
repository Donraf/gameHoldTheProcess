import { AppBar, Box, Button, CssBaseline, Toolbar, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { HOME_ROUTE } from "../utils/constants";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ width: "100%" }}>
        <Toolbar>
          <Typography variant="h6" component="h1">
            Страница не найдена.
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Typography sx={{ marginBottom: 2 }}>Страница не найдена.</Typography>
        <Button variant="contained" onClick={() => navigate(HOME_ROUTE)}>
          На главную
        </Button>
      </Box>
    </Box>
  );
}
