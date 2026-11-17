import React, { useCallback, useContext, useEffect, useState } from "react";
import dateFormat from "dateformat";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
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
import { useSnackbar } from "notistack";
import { fetchUser, getPlayersEvents, getPlayersEventsPageCount, getPlayersStat } from "../http/userAPI";
import { useParams } from "react-router-dom";
import { computeStatistics, getStatistics, getStatisticsParSetIds } from "../http/statisticsAPI";
import { Context } from "..";
import { USER_ROLE_ADMIN } from "../utils/constants";
import { parSetLabel } from "../utils/parSet";
import StatisticsIcon from "../components/icons/StatisticsIcon";
import ResUserChoiceCharts from "../components/ResUserChoiceCharts";
import ResUserChoiceAbsTable from "../components/ResUserChoiceAbsTable";
import ResUserVengerTable from "../components/ResUserVengerTable";
import PlayerTestResults from "../components/PlayerTestResults";
import PlayerParSetsSummary from "../components/PlayerParSetsSummary";

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

// Заголовок секции страницы: единый стиль вместо разрозненных fontSize.
const SectionTitle = ({ children }) => (
  <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
    {children}
  </Typography>
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

// Скачивание табличных данных (массив строк-массивов) в CSV или XLSX.
const downloadCsv = (rows, fileName) => {
  const escapeCell = (text) => `"${String(text).replaceAll('"', '""')}"`;
  const lines = rows.map((row) => row.map((cell) => escapeCell(cell)).join(";"));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadXlsx = async (rows, fileName, colWidths) => {
  const { utils, writeFile } = await import("xlsx");
  const sheet = utils.aoa_to_sheet(rows);
  if (colWidths) {
    sheet["!cols"] = colWidths.map((wch) => ({ wch }));
  }
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Данные");
  writeFile(book, `${fileName}.xlsx`);
};

const ResearcherUser = () => {
  const { user } = useContext(Context);
  const { userId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const notifyError = (text) =>
    enqueueSnackbar(text, { variant: "error", autoHideDuration: 4000, preventDuplicate: true });

  const [player, setPlayer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerNotFound, setPlayerNotFound] = useState(false);
  const [parSetIdsWithStats, setParSetIdsWithStats] = useState([]);

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
    Promise.all([getPlayersStat("user_id", userId, 1), fetchUser(userId), getStatisticsParSetIds(userId)]).then(
      ([players, userResponse, statsParSetIds]) => {
        const found = players[0] ?? null;
        if (found === null) {
          setPlayerNotFound(true);
        } else {
          setPlayer(found);
          setProfile(userResponse.data ?? userResponse);
          setParSetIdsWithStats(statsParSetIds);
          // Выбираем текущий набор, если по нему есть статистика,
          // иначе первый набор со статистикой, иначе null (покажем заглушку).
          const available = found.par_sets.filter((ps) => statsParSetIds.includes(ps.id));
          if (available.some((ps) => ps.id === found.cur_par_set_id)) {
            setSelectedParSetId(found.cur_par_set_id);
          } else {
            setSelectedParSetId(available.length > 0 ? available[0].id : null);
          }
        }
        setPlayerLoading(false);
      },
      () => {
        setPlayerNotFound(true);
        setPlayerLoading(false);
      }
    );
  }, [userId]);

  const filterData = useCallback(async () => {
    if (player === null || selectedParSetId === null) {
      return;
    }
    const [filteredDataFromQuery, newPageCount, nextStats] = await Promise.all([
      getPlayersEvents(player.id, selectedParSetId, page, EVENT_TYPE_MAP.get(selectedGroup)),
      getPlayersEventsPageCount(player.id, selectedParSetId, EVENT_TYPE_MAP.get(selectedGroup)),
      getStatistics(player.id, selectedParSetId),
    ]);
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
    setStats(nextStats);
  }, [player, page, selectedGroup, selectedParSetId]);

  useEffect(() => {
    setIsDataFetched(false);
    filterData()
      .catch(() => notifyError("Ошибка при загрузке данных игрока"))
      .finally(() => setIsDataFetched(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterData]);

  const computeStats = async () => {
    computeStatistics(player.id, selectedParSetId).then((nextStats) => {
      setStats(nextStats);
    });
  };

  // Выгрузка всех событий по текущему фильтру (все страницы) в CSV или Excel.
  const [exporting, setExporting] = useState(false);
  const exportEvents = async (format) => {
    if (exporting) {
      return;
    }
    setExporting(true);
    try {
      const groupFilter = EVENT_TYPE_MAP.get(selectedGroup);
      const totalPages = await getPlayersEventsPageCount(player.id, selectedParSetId, groupFilter);
      let allEvents = [];
      for (let p = 1; p <= totalPages; p++) {
        const events = await getPlayersEvents(player.id, selectedParSetId, p, groupFilter);
        allEvents = allEvents.concat(events);
      }

      const rows = [
        ["Значение процесса", "События", "Текст подсказки"],
        ...allEvents.map((event) => [
          String(event.x.toFixed(2)).replace(".", ","),
          event.name.join(" | "),
          event.check_info ?? "",
        ]),
      ];
      const fileName = `events_user${player.id}_parset${selectedParSetId}`;

      if (format === "xlsx") {
        await downloadXlsx(rows, fileName, [18, 60, 40]);
      } else {
        downloadCsv(rows, fileName);
      }
    } catch (e) {
      notifyError("Ошибка при выгрузке событий");
    } finally {
      setExporting(false);
    }
  };

  // Выгрузка сводной таблицы «Число реакций по значениям процесса» (статистика Венгера).
  const exportReactions = async (format) => {
    if (exporting) {
      return;
    }
    setExporting(true);
    try {
      const chunks = JSON.parse(stats.choice_stats_venger_charts);
      const stat = chunks[chunks.length - 1].ChunkChoiceStat;
      const xs = Object.keys(stat).sort((a, b) => Number(a) - Number(b));

      const rows = [
        ["Вид реакции", ...xs],
        ["Ост (остановки)", ...xs.map((x) => stat[x].StopAbs)],
        ["Прд (продолжения)", ...xs.map((x) => stat[x].ContAbs)],
        ["Зпр (запросы информации)", ...xs.map((x) => stat[x].HintAbs)],
      ];
      const fileName = `reactions_user${player.id}_parset${selectedParSetId}`;

      if (format === "xlsx") {
        await downloadXlsx(rows, fileName, [24]);
      } else {
        downloadCsv(rows, fileName);
      }
    } catch (e) {
      notifyError("Ошибка при выгрузке таблицы реакций");
    } finally {
      setExporting(false);
    }
  };

  // В селектор попадают только наборы, по которым есть посчитанная статистика.
  const parSetsWithStats = (player?.par_sets ?? []).filter((ps) =>
    parSetIdsWithStats.includes(ps.id)
  );

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
            Игрок
          </Typography>
          <Stack sx={{ maxWidth: 560 }} direction="column" spacing={0.5}>
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

          <SectionTitle>Пройденные тесты</SectionTitle>
          <PlayerTestResults userId={player.id} />

          <Divider />

          {parSetsWithStats.length === 0 ? (
            <Typography
              sx={{ color: "text.secondary", fontSize: 18, textAlign: "center", py: 4 }}
              component="div"
            >
              Данные по играм этого игрока отсутствуют
            </Typography>
          ) : (
            <>
          <SectionTitle>Сводка по наборам параметров</SectionTitle>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }} component="div">
            Клик по строке выбирает набор для детальной статистики ниже
          </Typography>
          <PlayerParSetsSummary
            userId={player.id}
            parSets={parSetsWithStats}
            selectedId={selectedParSetId}
            onSelect={(id) => {
              setPage(1);
              setSelectedParSetId(id);
            }}
          />
          <Divider />

          <Stack direction="row" spacing={1.5} alignItems="center">
            <SectionTitle>Статистика по набору параметров</SectionTitle>
            <Chip
              color="primary"
              label={parSetLabel(player.par_sets.find((parSet) => parSet.id === selectedParSetId) ?? { id: selectedParSetId })}
            />
            {user.isAuth && user.user.role === USER_ROLE_ADMIN ? (
              <Button
                variant="contained"
                size="small"
                sx={{ ml: "auto" }}
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
          </Stack>
          {stats === null ? (
            <Typography sx={{ fontSize: 16, color: "text.secondary" }} component="div">
              Загрузка статистики…
            </Typography>
          ) : (
            <>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Всего геймов {stats.games_num}. Из них остановок - {stats.stops_num}, взрывов -{" "}
            {stats.crashes_num}. Итоговый счёт {stats.total_score}.
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Остановка по сигналу n={stats.stop_on_signal_num} μ=
            {stats.mean_stop_on_signal.toFixed(3)} σ=
            {stats.stdev_stop_on_signal.toFixed(3)}
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Запрос информации по сигналу n={stats.hint_on_signal_num} μ=
            {stats.mean_hint_on_signal.toFixed(3)} σ=
            {stats.stdev_hint_on_signal.toFixed(3)}
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
            Продолжение после сигнала n={stats.continue_after_signal_num} μ=
            {stats.mean_continue_after_signal.toFixed(3)} σ=
            {stats.stdev_continue_after_signal.toFixed(3)}
          </Typography>
          <ResUserChoiceCharts choiceStats={stats.choice_stats}/>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flexGrow: 1 }}>
              <SectionTitle>Число реакций по значениям процесса</SectionTitle>
              <Typography sx={{ color: "text.secondary", fontSize: 14 }} component="div">
                Ост — остановки, Прд — продолжения, Зпр — запросы информации
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={() => exportReactions("csv")} disabled={exporting}>
              CSV
            </Button>
            <Button variant="outlined" size="small" onClick={() => exportReactions("xlsx")} disabled={exporting}>
              Excel
            </Button>
          </Stack>
          <ResUserChoiceAbsTable choiceStats={stats.choice_stats_venger_charts}/>
          <SectionTitle>Статистика по Венгеру</SectionTitle>
          <ResUserChoiceCharts choiceStats={stats.choice_stats_venger_charts}/>
          <ResUserVengerTable choiceStats={stats.choice_stats_venger_table}/>
            </>
          )}
          <Divider />

          <SectionTitle>События</SectionTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Autocomplete
              options={Array.from(EVENT_TYPE_MAP.keys())}
              renderInput={(params) => <TextField {...params} label="Выберите вид события" />}
              value={selectedGroup}
              onChange={(_, newValue) => {
                const newSelectedGroup = newValue ? newValue : "";
                setPage(1);
                setSelectedGroup(newSelectedGroup);
              }}
              disableClearable
              sx={{
                flexGrow: 9,
              }}
            />
            <Button variant="outlined" onClick={() => exportEvents("csv")} disabled={exporting}>
              {exporting ? "Выгрузка..." : "Выгрузить в CSV"}
            </Button>
            <Button variant="outlined" onClick={() => exportEvents("xlsx")} disabled={exporting}>
              {exporting ? "Выгрузка..." : "Выгрузить в Excel"}
            </Button>
          </Stack>
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
              sx={{ pt: 2 }}
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
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ResearcherUser;
