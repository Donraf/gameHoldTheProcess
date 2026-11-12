import React, { useContext, useEffect, useMemo, useState } from "react";
import dateFormat from "dateformat";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { changeGroupParSet, createGroup, getAllGroups } from "../http/userAPI";
import ChangeIconBlack from "../components/icons/ChangeIconBlack";
import { ModalContent } from "../components/ModalContent";
import { Context } from "../index";

const formatParSetLabel = (parSet) =>
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
  parSet.missing_danger_prob;

const ResearcherGroup = () => {
  const { user } = useContext(Context);
  const { enqueueSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [parSets, setParSets] = useState([]);
  const [searchText, setSearchText] = useState("");

  // Модалка смены набора параметров
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [chosenGroup, setChosenGroup] = useState(null);
  const [selectedParSetId, setSelectedParSetId] = useState(-1);

  // Модалка создания группы
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupParSetId, setNewGroupParSetId] = useState(-1);

  // Подтверждение массового изменения
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const notifyError = (text) =>
    enqueueSnackbar(text, { variant: "error", autoHideDuration: 5000, preventDuplicate: true });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groupsData, parSetsData] = await Promise.all([getAllGroups(), getParSets(-1)]);
      setGroups(groupsData);
      setParSets(parSetsData);
    } catch (e) {
      notifyError("Не удалось загрузить данные страницы");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- загрузка при монтировании

  const filteredGroups = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    if (needle === "") {
      return groups;
    }
    return groups.filter((group) => group.name.toLowerCase().includes(needle));
  }, [groups, searchText]);

  const parSetById = (id) => parSets.find((parSet) => parSet.id === id);

  const openChangeModal = (group) => {
    setChosenGroup(group);
    setSelectedParSetId(group.parameter_set_id);
    setIsChangeModalOpen(true);
  };

  const closeChangeModal = () => {
    setIsChangeModalOpen(false);
    setChosenGroup(null);
    setSelectedParSetId(-1);
  };

  const handleApplyClick = () => {
    if (selectedParSetId === -1) {
      notifyError("Выберите набор параметров");
      return;
    }
    setIsConfirmOpen(true);
  };

  const applyParSetChange = () => {
    changeGroupParSet(chosenGroup.id, selectedParSetId).then(
      () => {
        enqueueSnackbar(`Набор параметров группы ${chosenGroup.name} обновлен`, {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setIsConfirmOpen(false);
        closeChangeModal();
        loadData();
      },
      () => {
        notifyError("Ошибка при обновлении набора параметров");
        setIsConfirmOpen(false);
      }
    );
  };

  const openCreateModal = () => {
    setNewGroupName("");
    setNewGroupParSetId(-1);
    setIsCreateModalOpen(true);
  };

  const createGroupUi = () => {
    const name = newGroupName.trim();
    if (name === "") {
      notifyError("Введите название группы");
      return;
    }
    if (newGroupParSetId === -1) {
      notifyError("Выберите набор параметров");
      return;
    }
    createGroup(name, user.user.user_id, newGroupParSetId).then(
      () => {
        enqueueSnackbar(`Группа ${name} создана`, {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setIsCreateModalOpen(false);
        loadData();
      },
      () => {
        notifyError("Ошибка при создании группы");
      }
    );
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

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              sx={{ flexGrow: 1 }}
              label="Поиск по названию"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              sx={{ height: "40px", whiteSpace: "nowrap" }}
              variant="contained"
              onClick={openCreateModal}
            >
              Создать группу
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID группы</TableCell>
                  <TableCell>Наименование</TableCell>
                  <TableCell>Набор параметров</TableCell>
                  <TableCell>Время создания</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      Группы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const parSet = parSetById(group.parameter_set_id);
                    return (
                      <TableRow key={group.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ width: 75 }}>
                          <Stack direction="row" spacing={1}>
                            <ImageButton onClick={() => openChangeModal(group)}>
                              <ChangeIconBlack />
                            </ImageButton>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {group.id}
                        </TableCell>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>
                          {parSet ? formatParSetLabel(parSet) : "ID: " + group.parameter_set_id}
                        </TableCell>
                        <TableCell>{dateFormat(group.created_at, "yyyy-mm-dd HH:MM:ss")}</TableCell>
                      </TableRow>
                    );
                  })
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
          open={isChangeModalOpen}
          onClose={closeChangeModal}
        >
          <ModalContent sx={{ width: 800 }}>
            <Typography variant="h4" noWrap component="div">
              Изменение группы {chosenGroup?.name}
            </Typography>
            <Autocomplete
              options={parSets}
              getOptionLabel={formatParSetLabel}
              renderInput={(params) => <TextField {...params} label="Выберите набор параметров" />}
              value={parSetById(selectedParSetId) || null}
              onChange={(_, newValue) => {
                setSelectedParSetId(newValue ? newValue.id : -1);
              }}
            />
            <Button
              sx={{ width: "fit-content", height: "40px" }}
              variant="contained"
              onClick={handleApplyClick}
            >
              Изменить набор параметров у всей группы
            </Button>
          </ModalContent>
        </Modal>

        <Modal
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <ModalContent sx={{ width: 800 }}>
            <Typography variant="h4" noWrap component="div">
              Создание группы
            </Typography>
            <TextField
              label="Название группы"
              variant="outlined"
              fullWidth
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Autocomplete
              options={parSets}
              getOptionLabel={formatParSetLabel}
              renderInput={(params) => <TextField {...params} label="Выберите набор параметров" />}
              value={parSetById(newGroupParSetId) || null}
              onChange={(_, newValue) => {
                setNewGroupParSetId(newValue ? newValue.id : -1);
              }}
            />
            <Button
              sx={{ width: "fit-content", height: "40px" }}
              variant="contained"
              onClick={createGroupUi}
            >
              Создать
            </Button>
          </ModalContent>
        </Modal>

        <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
          <DialogTitle>Подтверждение изменения</DialogTitle>
          <DialogContent>
            <Typography>
              Назначить группе «{chosenGroup?.name}» набор параметров ID: {selectedParSetId}? Изменение
              применится ко всем участникам группы.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsConfirmOpen(false)}>Отмена</Button>
            <Button variant="contained" onClick={applyParSetChange}>
              Применить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ResearcherGroup;
