import React, { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  CssBaseline,
  Pagination,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import { getAllGroups, getPlayersPageCount, getPlayersStat } from "../http/userAPI";
import { getParSets } from "../http/graphAPI";
import PlayersGrid from "../components/PlayersGrid";
import ChangeParSetModal from "../components/ChangeParSetModal";
import { useSearchParams } from "react-router-dom";
import { NO_GROUP_OPTION } from "../utils/constants";

const ResearcherRoom = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  var qGroupName = searchParams.get("group_name");
  var qNoGroup = searchParams.get("no_group");
  var qPage = searchParams.get("page");

  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroupName, setSelectedGroupName] = useState(qGroupName);
  const [parSets, setParSets] = useState([]);
  const [parSetModalPlayer, setParSetModalPlayer] = useState(null);

  const filterData = useCallback(async () => {
    let filteredDataFromQuery;
    let newPageCount;
    if (qNoGroup) {
      filteredDataFromQuery = await getPlayersStat("no_group", "", parseInt(qPage));
      newPageCount = await getPlayersPageCount("no_group", "");
    } else if (qGroupName) {
      filteredDataFromQuery = await getPlayersStat("group_name", qGroupName, parseInt(qPage));
      newPageCount = await getPlayersPageCount("group_name", qGroupName);
    } else {
      filteredDataFromQuery = await getPlayersStat(null, null, parseInt(qPage));
      newPageCount = await getPlayersPageCount();
    }
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
  }, [qGroupName, qNoGroup, qPage]);

  useEffect(() => {
    fetchGroups();
    // Все наборы параметров грузим один раз на страницу — карточки
    // игроков используют их через пропсы.
    getParSets(-1).then((data) => {
      setParSets(data);
    });
  }, []);

  const handleParSetUpdated = (playerId, newParSetId) => {
    setFilteredData((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, cur_par_set_id: newParSetId } : player
      )
    );
  };

  useEffect(() => {
    setIsDataFetched(false);
    filterData().then(() => {
      setIsDataFetched(true);
    });
  }, [searchParams, filterData]);

  const fetchGroups = () => {
    getAllGroups().then((data) => {
      setFetchedGroups(data);
    });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" component="h1">
            Выбрать группу участников
          </Typography>
          <Autocomplete
            options={[NO_GROUP_OPTION, ...fetchedGroups]}
            getOptionLabel={(group) => group.name}
            renderInput={(params) => <TextField {...params} label="Выберите группу" />}
            value={
              qNoGroup
                ? NO_GROUP_OPTION
                : fetchedGroups.find((group) => group.name === selectedGroupName) || null
            }
            onChange={(_, newValue) => {
              if (newValue && newValue.id === NO_GROUP_OPTION.id) {
                setSelectedGroupName("");
                setSearchParams({ no_group: "1", page: 1 });
              } else {
                const newSelectedGroupName = newValue ? newValue.name : "";
                setSelectedGroupName(newSelectedGroupName);
                setSearchParams({ group_name: newSelectedGroupName, page: 1 });
              }
            }}
          />
          <PlayersGrid
            players={filteredData}
            parSets={parSets}
            onChangeParSet={(player) => setParSetModalPlayer(player)}
          />
          {isDataFetched ? (
            <Pagination
              sx={{ pt: 2 }}
              count={pageCount}
              page={parseInt(qPage)}
              onChange={(event, value) => {
                if (qNoGroup) {
                  setSearchParams({ no_group: "1", page: value });
                } else {
                  setSearchParams({ group_name: qGroupName, page: value });
                }
              }}
              variant="outlined"
              shape="rounded"
            />
          ) : (
            <></>
          )}
        </Stack>
      </Box>
      {parSetModalPlayer && (
        <ChangeParSetModal
          player={parSetModalPlayer}
          parSets={parSets}
          onClose={() => setParSetModalPlayer(null)}
          onUpdated={handleParSetUpdated}
        />
      )}
    </Box>
  );
};

export default ResearcherRoom;
