import React, { useContext, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CssBaseline,
  Modal,
  Pagination,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import { useSnackbar } from "notistack";
import AddIcon from "../components/icons/AddIcon";
import { COLORS } from "../utils/constants";
import { createGroup, getAllGroups, getPlayersPageCount, getPlayersStat } from "../http/userAPI";
import { ModalContent } from "../components/ModalContent";
import { Context } from "..";
import PlayersGrid from "../components/PlayersGrid";

const ResearcherRoom = () => {
  const { user } = useContext(Context);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filterInput, setFilterInput] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [name, setName] = useState("");

  const [isCreateGroupModalOpened, setIsCreateGroupModalOpened] = React.useState(false);
  const handleOpenCreateGroupModal = () => setIsCreateGroupModalOpened(true);
  const handleCloseCreateGroupModal = () => setIsCreateGroupModalOpened(false);

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchGroups();
  }, []);

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
  }, [filterInput]);

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts]);

  const tryCreateGroup = () => {
    let snackErrors = [];
    if (name === "") {
      snackErrors.push("Введите наименование группы");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    createGroup(name, user.user.user_id).then(
      (_) => {
        enqueueSnackbar("Группа добавлена", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setName("");
        fetchGroups();
      },
      (_) => {
        enqueueSnackbar("Ошибка при добавлении группы", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const fetchGroups = () => {
    getAllGroups().then((data) => {
      setFetchedGroups(data);
    });
  };

  const filterData = async (updatePage) => {
    let filteredDataFromQuery;
    let newPageCount;
    if (filterInput) {
      filteredDataFromQuery = await getPlayersStat("group_name", filterInput, page);
      newPageCount = await getPlayersPageCount("group_name", filterInput);
    } else {
      filteredDataFromQuery = await getPlayersStat(null, null, page);
      newPageCount = await getPlayersPageCount();
    }
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
        <Modal
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          open={isCreateGroupModalOpened}
          onClose={handleCloseCreateGroupModal}
        >
          <ModalContent sx={{ width: 800 }}>
            <Typography variant="h4" noWrap component="div">
              Добавление новой группы
            </Typography>
            <TextField
              onChange={(event) => {
                setName(event.target.value);
              }}
              value={name}
              id="outlined-basic"
              label="Введите наименование группы"
              required={true}
              variant="outlined"
            />
            <Button
              sx={{ width: "fit-content", height: "40px" }}
              variant="contained"
              onClick={() => {
                tryCreateGroup();
              }}
            >
              Добавить группу
            </Button>
          </ModalContent>
        </Modal>
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" noWrap component="div">
            Выбрать группу участников
          </Typography>
          <Stack direction="row" gap={1}>
            <Autocomplete
              options={fetchedGroups}
              getOptionLabel={(group) => group.name}
              renderInput={(params) => <TextField {...params} label="Выберите группу" />}
              value={fetchedGroups.find((group) => group.name === selectedGroupName) || null}
              onChange={(_, newValue) => {
                const newSelectedGroupName = newValue ? newValue.name : "";
                setSelectedGroupName(newSelectedGroupName);
                setFilterInput(newSelectedGroupName);
              }}
              sx={{
                flexGrow: 9,
              }}
            />
            <Button
              variant="outlined"
              sx={{
                color: "#FFFFFF",
                backgroundColor: COLORS.mainTheme,
                flexGrow: 1,
              }}
              onClick={() => {
                handleOpenCreateGroupModal();
              }}
              startIcon={<AddIcon />}
            >
              Добавить группу
            </Button>
          </Stack>
          <PlayersGrid players={filteredData} />
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

export default ResearcherRoom;
