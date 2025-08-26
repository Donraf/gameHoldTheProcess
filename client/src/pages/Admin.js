import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Box, Button, CssBaseline, Stack, Toolbar, Typography } from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import { ADMIN_GRAPH_ROUTE, ADMIN_USER_ROUTE } from "../utils/constants";
import Grid from "@mui/material/Grid2";
import { fetchPointsInCsv } from "../http/pointAPI";
import { createGraph } from "../http/graphAPI";
import { Context } from "..";
import { ChartData } from "../utils/ChartData";

const Admin = observer(() => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />

        <Stack width={"100%"} direction="column" spacing={1}>
          <Typography variant="h4" component="div">
            Изменение объектов
          </Typography>

          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    navigate(ADMIN_USER_ROUTE);
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
                    for (let i = 0; i < 100; i++) {
                      let chartData = new ChartData();
                      chartData.setParSet({ id: 1, gain_coef: 0.92, time_const: 20, noise_coef: 0.03, false_warning_prob: 0, missing_danger_prob: 0});
                      while (!chartData.isCrashed()) {
                        chartData.generateNextPoint();
                      }
                      createGraph(
                        chartData.points.slice(chartData.maxPointsToShow),
                        user.user.user_id,
                        chartData.parSet.id
                      );
                      console.log("Created graph " + (i + 1));
                    }
                  }}
                >
                  Добавить новые графики
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h4" component="div">
            Выгрузка данных
          </Typography>

          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Button
                  sx={{ width: "100%", height: "64px" }}
                  variant="contained"
                  onClick={() => {
                    fetchPointsInCsv().then((response) => {
                      const fileurl = window.URL.createObjectURL(new Blob([response]));
                      const link = document.createElement("a");
                      link.href = fileurl;
                      link.setAttribute("download", "points.csv");
                      document.body.appendChild(link);
                      link.click();
                    });
                  }}
                >
                  Выгрузить все сыгранные игры
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
