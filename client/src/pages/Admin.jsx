import React from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Box, Button, CssBaseline, Stack, Toolbar, Typography } from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import { ADMIN_GRAPH_ROUTE, ADMIN_PARSET_ROUTE, ADMIN_TESTS_ROUTE, ADMIN_USER_ROUTE, ADMIN_GROUP_ROUTE } from "../utils/constants";
import Grid from "@mui/material/Grid2";

const Admin = observer(() => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />

        <Stack width={"100%"} direction="column" spacing={1}>
          <Typography variant="h4" component="h1">
            Изменение объектов
          </Typography>

          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    navigate(ADMIN_USER_ROUTE + "?group_name=&page=1");
                  }}
                >
                  Изменить пользователя
                </Button>
              </Grid>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    navigate(ADMIN_GRAPH_ROUTE);
                  }}
                >
                  Изменить пройденную игру
                </Button>
              </Grid>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    navigate(ADMIN_PARSET_ROUTE);
                  }}
                >
                  Изменить набор параметров
                </Button>
              </Grid>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    navigate(ADMIN_TESTS_ROUTE);
                  }}
                >
                  Управление тестами
                </Button>
              </Grid>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    navigate(ADMIN_GROUP_ROUTE);
                  }}
                >
                  Изменить группу
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
});

export default Admin;
