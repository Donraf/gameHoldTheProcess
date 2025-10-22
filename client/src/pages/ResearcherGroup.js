import React, { useEffect, useState } from "react";
import dateFormat from "dateformat";
import {
  Autocomplete,
  Box,
  Button,
  CssBaseline,
  Modal,
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
import ImageButton from "../components/ImageButton/ImageButton";
import { useSnackbar } from "notistack";
import { getParSets } from "../http/graphAPI";
import { changeGroupParSet, getAllGroups } from "../http/userAPI";
import ChangeIconBlack from "../components/icons/ChangeIconBlack";
import { ModalContent } from "../components/ModalContent";

const ResearcherGroup = () => {
  const [updateTrigger, setUpdateTrigger] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [fetchedGroups, setFetchedGroups] = useState(null);
  const [fetchedParSets, setFetchedParSets] = useState([]);
  const [selectedParSetId, setSelectedParSetId] = useState(-1);
  const [chosenGroupId, setChosenGroupId] = useState(-1);

  const [isChangeGroupModalOpened, setIsChangeGroupModalOpened] = React.useState(false);
  const handleOpenChangeGroupModal = () => setIsChangeGroupModalOpened(true);
  const handleCloseChangeGroupModal = () => {
    setIsChangeGroupModalOpened(false);
    setSelectedParSetId(-1);
    setChosenGroupId(-1);
  };

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchParSets();
  }, []);

  useEffect(() => {
    setIsDataFetched(false);
    fetchGroups().then(() => {
      setIsDataFetched(true);
    });
  }, [updateTrigger]);

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts]);

  const changeGroupParSetUi = () => {
    let snackErrors = [];
    if (selectedParSetId === -1) {
      snackErrors.push("Выберите набор параметров");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }
    changeGroupParSet(chosenGroupId, selectedParSetId).then(
      (_) => {
        enqueueSnackbar(
          "Набор параметров группы " + fetchedGroups?.find((group) => group.id === chosenGroupId)?.name + " обновлен",
          {
            variant: "success",
            autoHideDuration: 3000,
            preventDuplicate: true,
          }
        );
        setUpdateTrigger(!updateTrigger);
        handleCloseChangeGroupModal();
      },
      (_) => {
        enqueueSnackbar("Ошибка при обновлении набора параметров", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const fetchGroups = async () => {
    let fetchedGroups = await getAllGroups();
    setFetchedGroups(fetchedGroups);
  };

  const fetchParSets = () => {
    getParSets(-1).then((data) => {
      setFetchedParSets(data);
    });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" noWrap component="div">
            Работа с группами
          </Typography>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID группы</TableCell>
                  <TableCell>Наименование</TableCell>
                  <TableCell>ID набора параметров</TableCell>
                  <TableCell>Время создания</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched ? (
                  fetchedGroups.map((group) => (
                    <TableRow key={group.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell sx={{ width: 75 }}>
                        <Stack direction="row" spacing={1}>
                          <ImageButton
                            onClick={() => {
                              setChosenGroupId(group.id);
                              handleOpenChangeGroupModal();
                            }}
                          >
                            <ChangeIconBlack />
                          </ImageButton>
                        </Stack>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {group.id}
                      </TableCell>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.parameter_set_id}</TableCell>
                      <TableCell>{dateFormat(group.created_at, "yyyy-mm-dd HH:MM:ss")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <></>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
        <Modal
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          open={isChangeGroupModalOpened}
          onClose={handleCloseChangeGroupModal}
        >
          <ModalContent sx={{ width: 800 }}>
            <Typography variant="h4" noWrap component="div">
              Изменение группы {fetchedGroups?.find((group) => group.id === chosenGroupId)?.name}
            </Typography>
            <Autocomplete
              options={fetchedParSets}
              getOptionLabel={(parSet) =>
                "ID: " +
                parSet.id +
                " | a: " +
                parSet.a +
                " | b: " +
                parSet.b +
                " | мат. ож.: " +
                parSet.noise_mean +
                " | ср. откл.: " +
                parSet.noise_stdev +
                " | вер. лож. трев: " +
                parSet.false_warning_prob +
                " | вер. проп.: " +
                parSet.missing_danger_prob
              }
              renderInput={(params) => <TextField {...params} label="Выберите набор параметров" />}
              value={fetchedParSets.find((parSet) => parSet.id === selectedParSetId) || null}
              onChange={(_, newValue) => {
                const newSelectedParSetId = newValue ? newValue.id : -1;
                setSelectedParSetId(newSelectedParSetId);
              }}
            />
            <Button
              sx={{ width: "fit-content", height: "40px" }}
              variant="contained"
              onClick={() => {
                changeGroupParSetUi();
              }}
            >
              Изменить набор параметров у всей группы
            </Button>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

export default ResearcherGroup;
