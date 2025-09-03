import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  CssBaseline,
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
import { getPlayersEvents, getPlayersEventsPageCount } from "../http/userAPI";
import { useLocation } from "react-router-dom";

const ResearcherUser = () => {
  const location = useLocation();
  const [selectedParSetId, setSelectedParSetId] = useState(location.state.player.cur_par_set_id);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [selectedGroup, setSelectedGroup] = React.useState("Все события");

  const eventTypeMap = new Map([
    ["Все события",""],
    ["Ручная остановка","stop"],
    ["Пауза","pause"],
    ["Использована подсказка","check"],
    ["Отклонение совета ИИ","reject_advice"],
  ])

  useEffect(() => {
    setIsDataFetched(false);
    filterData(false).then(() => {
      setIsDataFetched(true);
    });
  }, [page]);

  useEffect(() => {
    setIsDataFetched(false);
    filterData(true).then(() => {
      setIsDataFetched(true);
    });
  }, [selectedParSetId, selectedGroup]);

  const filterData = async (updatePage) => {
    let filteredDataFromQuery;
    filteredDataFromQuery = await getPlayersEvents(location.state.player.id, selectedParSetId, page, eventTypeMap.get(selectedGroup));
    let newPageCount = await getPlayersEventsPageCount(location.state.player.id, selectedParSetId, eventTypeMap.get(selectedGroup));
    setPageCount(newPageCount);
    if (updatePage) setPage(1);
    setFilteredData(filteredDataFromQuery);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
            ФИО игрока: {location.state.player.name}
          </Typography>

          <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
            Набор параметров:
          </Typography>
          <Autocomplete
            options={location.state.player.par_sets}
            getOptionLabel={(parSet) => parSet.id.toString()}
            renderInput={(params) => <TextField {...params} label="Выберите набор параметров" />}
            value={location.state.player.par_sets.find((parSet) => parSet.id === selectedParSetId) || null}
            onChange={(_, newValue) => {
              const newSelectedParSetId = newValue ? newValue.id : 0;
              setSelectedParSetId(newSelectedParSetId);
            }}
            disableClearable
            sx={{
              flexGrow: 9,
            }}
          />
          <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
            Вид события:
          </Typography>
          <Autocomplete
            options={Array.from(eventTypeMap.keys())}
            renderInput={(params) => <TextField {...params} label="Выберите вид события" />}
            value={selectedGroup}
            onChange={(_, newValue) => {
              const newSelectedGroup = newValue ? newValue : "";
              setSelectedGroup(newSelectedGroup)
            }}
            disableClearable
            sx={{
              flexGrow: 9,
            }}
          />
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Значение процесса</TableCell>
                  <TableCell>События</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched ? (
                  filteredData.map((event) => (
                    <TableRow key={event.x} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell width={60} component="th" scope="row">
                        {event.x.toFixed(2)}
                      </TableCell>
                      <TableCell>{event.name.join(" | ")}</TableCell>
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
