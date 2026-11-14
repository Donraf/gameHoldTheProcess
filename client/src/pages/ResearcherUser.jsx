import React, { useCallback, useContext, useEffect, useState } from "react";
import dateFormat from "dateformat";
import {
  Autocomplete,
  Box,
  Button,
  CssBaseline,
  Divider,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import { fetchUser, getPlayersEvents, getPlayersEventsPageCount, getPlayersStat } from "../http/userAPI";
import { useParams } from "react-router-dom";
import { computeStatistics, getStatistics } from "../http/statisticsAPI";
import { Context } from "..";
import { USER_ROLE_ADMIN } from "../utils/constants";
import { parSetLabel } from "../utils/parSet";
import StatisticsIcon from "../components/icons/StatisticsIcon";
import ResUserCharts from "../components/ResUserCharts";
import ResUserVengerTable from "../components/ResUserVengerTable";
import ResUserVengerCharts from "../components/ResUserVengerCharts";
import PlayerTestResults from "../components/PlayerTestResults";

const EVENT_TYPE_MAP = new Map([
  ["Все события", ""],
  ["Ручная остановка", "stop"],
  ["Пауза", "pause"],
  ["Использована подсказка", "check"],
  ["Отклонение совета ИИ", "reject_advice"],
]);

const InfoRow = ({ label, value }) => (
  <Stack width={"100%"} direction="row" spacing={0.5}>
    <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
      {label}:
    </Typography>
    <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
      {value ?? "—"}
    </Typography>
  </Stack>
);

function formatExperience(years, months) {
  if (years == null && months == null) {
    return null;
  }
  const parts = [];
  if (years != null) {
    parts.push(`${years} г.`);
  }
  if (months != null) {
    parts.push(`${months} мес.`);
  }
  return parts.join(" ");
}

const ResearcherUser = () => {
  const { user } = useContext(Context);
  const { userId } = useParams();

  const [player, setPlayer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerNotFound, setPlayerNotFound] = useState(false);

  const [selectedParSetId, setSelectedParSetId] = useState(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [selectedGroup, setSelectedGroup] = React.useState("Все события");

  // Загрузка игрока по id из URL — страница переживает F5 и прямой заход по ссылке.
  useEffect(() => {
    setPlayerLoading(true);
    setPlayerNotFound(false);
    Promise.all([getPlayersStat("user_id", userId, 1), fetchUser(userId)]).then(
      ([players, userResponse]) => {
        const found = players[0] ?? null;
        if (found === null) {
          setPlayerNotFound(true);
        } else {
          setPlayer(found);
          setSelectedParSetId(found.cur_par_set_id);
          setProfile(userResponse.data ?? userResponse);
        }
        setPlayerLoading(false);
      },
      () => {
        setPlayerNotFound(true);
        setPlayerLoading(false);
      }
    );
  }, [userId]);

  const filterData = useCallback(
    async (updatePage) => {
      if (player === null || selectedParSetId === null) {
        return;
      }
      const filteredDataFromQuery = await getPlayersEvents(
        player.id,
        selectedParSetId,
        page,
        EVENT_TYPE_MAP.get(selectedGroup)
      );
      const newPageCount = await getPlayersEventsPageCount(
        player.id,
        selectedParSetId,
        EVENT_TYPE_MAP.get(selectedGroup)
      );
      const nextStats = await getStatistics(player.id, selectedParSetId);
      setPageCount(newPageCount);
      if (updatePage) setPage(1);
      setFilteredData(filteredDataFromQuery);
      setStats(nextStats);
    },
    [player, page, selectedGroup, selectedParSetId]
  );

  useEffect(() => {
    setIsDataFetched(false);
    filterData(false).then(() => {
      setIsDataFetched(true);
    });
  }, [page, filterData]);

  useEffect(() => {
    setIsDataFetched(false);
    filterData(true).then(() => {
      setIsDataFetched(true);
    });
  }, [selectedParSetId, selectedGroup, filterData]);

  const computeStats = async () => {
    computeStatistics(player.id, selectedParSetId).then((nextStats) => {
      setStats(nextStats);
    });
  };

  if (playerLoading) {
    return (
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <NavBarDrawer />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
          <Toolbar />
          <Typography variant="h4" component="h1">
            Загрузка данных игрока...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (playerNotFound || player === null) {
    return (
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <NavBarDrawer />
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
          <Toolbar />
          <Typography variant="h4" component="h1">
            Игрок не найден
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" component="h1">
            Информация об игроке
          </Typography>
          <Stack width={"60%"} direction="column" spacing={0.5}>
            <InfoRow label="ФИО" value={player.name} />
            <InfoRow label="Логин" value={profile?.login} />
            <InfoRow label="Профессия" value={profile?.profession} />
            <InfoRow
              label="Стаж"
              value={formatExperience(profile?.experience_years, profile?.experience_months)}
            />
            <InfoRow label="Пол" value={profile?.gender} />
            <InfoRow label="Возраст" value={profile?.age != null ? `${profile.age} лет` : null} />
            <InfoRow
              label="Дата регистрации"
              value={profile?.created_at ? dateFormat(profile.created_at, "yyyy-mm-dd") : null}
            />
          </Stack>

          <Divider />

          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Пройденные тесты:
          </Typography>
          <PlayerTestResults userId={player.id} />

          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Набор параметров:
          </Typography>
          <Autocomplete
            options={player.par_sets}
            getOptionLabel={(parSet) => parSetLabel(parSet)}
            renderInput={(params) => <TextField {...params} label="Выберите набор параметров" />}
            value={player.par_sets.find((parSet) => parSet.id === selectedParSetId) || null}
            onChange={(_, newValue) => {
              const newSelectedParSetId = newValue ? newValue.id : 0;
              setSelectedParSetId(newSelectedParSetId);
            }}
            disableClearable
            sx={{
              flexGrow: 9,
            }}
          />
          {user.isAuth && user.user.role === USER_ROLE_ADMIN ? (
            <Button
              variant="contained"
              sx={{                height: "50%",
                flexGrow: 1,
}}
              onClick={() => {
                computeStats();
              }}
              startIcon={<StatisticsIcon />}
            >
              Рассчитать статистику
            </Button>
          ) : (
            <></>
          )}
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Статистика по набору параметров {parSetLabel(player.par_sets.find((parSet) => parSet.id === selectedParSetId) ?? { id: selectedParSetId })}:
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Всего геймов {stats?.games_num != null ? stats?.games_num : "???"}. Из них остановок -{" "}
            {stats?.stops_num != null ? stats?.stops_num : "???"}, взрывов -{" "}
            {stats?.crashes_num != null ? stats?.crashes_num : "???"}. Итоговый счёт{" "}
            {stats?.total_score != null ? stats?.total_score : "???"}.
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Остановка по сигналу n={stats?.stop_on_signal_num != null ? stats?.stop_on_signal_num : "???"} μ=
            {stats?.mean_stop_on_signal != null ? stats?.mean_stop_on_signal.toFixed(3) : "???"} σ=
            {stats?.stdev_stop_on_signal != null ? stats?.stdev_stop_on_signal.toFixed(3) : "???"}
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Запрос информации по сигналу n={stats?.hint_on_signal_num != null ? stats?.hint_on_signal_num : "???"} μ=
            {stats?.mean_hint_on_signal != null ? stats?.mean_hint_on_signal.toFixed(3) : "???"} σ=
            {stats?.stdev_hint_on_signal != null ? stats?.stdev_hint_on_signal.toFixed(3) : "???"}
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Продолжение после сигнала n={stats?.continue_after_signal_num != null ? stats?.continue_after_signal_num : "???"} μ=
            {stats?.mean_continue_after_signal != null ? stats?.mean_continue_after_signal.toFixed(3) : "???"} σ=
            {stats?.stdev_continue_after_signal != null ? stats?.stdev_continue_after_signal.toFixed(3) : "???"}
          </Typography>
          <ResUserCharts choiceStats={stats?.choice_stats}/>
          <Typography sx={{ fontSize: 32, fontWeight: "bold" }} component="div">
            Статистика по Венгеру:
          </Typography>
          <ResUserVengerCharts choiceStats={stats?.choice_stats_venger_charts}/>
          <ResUserVengerTable choiceStats={stats?.choice_stats_venger_table}/>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Вид события:
          </Typography>
          <Autocomplete
            options={Array.from(EVENT_TYPE_MAP.keys())}
            renderInput={(params) => <TextField {...params} label="Выберите вид события" />}
            value={selectedGroup}
            onChange={(_, newValue) => {
              const newSelectedGroup = newValue ? newValue : "";
              setSelectedGroup(newSelectedGroup);
            }}
            disableClearable
            sx={{
              flexGrow: 9,
            }}
          />
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Значение процесса</TableCell>
                  <TableCell>События</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched && filteredData !== null ? (
                  filteredData.map((event) => (
                    <TableRow key={event.x} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell width={60} component="th" scope="row">
                        {event.x.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {event.name.join(" | ") +
                          (event.check_info ? ' | Текст подсказки: "' + event.check_info + '"' : "")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <></>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {isDataFetched ? (
            <Pagination
              sx={{ pt: "16px" }}
              count={pageCount}
              page={page}
              onChange={(event, value) => {
                setPage(value);
              }}
              variant="outlined"
              shape="rounded"
            />
          ) : (
            <></>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ResearcherUser;
