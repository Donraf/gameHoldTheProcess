import React, { useEffect, useState } from "react";
import dateFormat from "dateformat";
import {
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import ImageButton from "../components/ImageButton/ImageButton";
import DeleteIcon from "../components/icons/DeleteIcon";
import { useSnackbar } from "notistack";
import { deleteGraph, fetchGraphs, getGraphsPageCount } from "../http/graphAPI";

const FILTER_OPTIONS = [
  { value: "user_name", label: "ФИО игрока" },
  { value: "user_login", label: "Логин игрока" },
  { value: "user_id", label: "ID игрока" },
];

const DEBOUNCE_MS = 400;

const AdminGraph = () => {
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filterTag, setFilterTag] = useState("user_name");
  const [filterInput, setFilterInput] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState({ tag: "user_name", value: "" });
  const [filteredData, setFilteredData] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  // Дебаунс: запрос уходит не на каждый символ, а после паузы во вводе.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter({ tag: filterTag, value: filterInput.trim() });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filterTag, filterInput]);

  // При смене фильтра возвращаемся на первую страницу.
  useEffect(() => {
    setPage(1);
  }, [debouncedFilter]);

  useEffect(() => {
    const load = async () => {
      setIsDataFetched(false);
      try {
        const tag = debouncedFilter.value === "" ? null : debouncedFilter.tag;
        const value = debouncedFilter.value === "" ? null : debouncedFilter.value;
        const [charts, newPageCount] = await Promise.all([
          fetchGraphs(tag, value, page, true),
          getGraphsPageCount(tag, value),
        ]);
        setFilteredData(charts);
        setPageCount(newPageCount);
      } catch (e) {
        enqueueSnackbar("Ошибка при загрузке списка игр", {
          variant: "error",
          autoHideDuration: 4000,
          preventDuplicate: true,
        });
      } finally {
        setIsDataFetched(true);
      }
    };
    load();
  }, [page, debouncedFilter, enqueueSnackbar]);

  const confirmDelete = () => {
    if (deleting || deleteTarget == null) {
      return;
    }

    setDeleting(true);
    deleteGraph(deleteTarget.id).then(
      () => {
        setDeleting(false);
        setDeleteTarget(null);
        enqueueSnackbar("Игра удалена", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setFilteredData((prev) => (prev === null ? prev : prev.filter((graph) => graph.id !== deleteTarget.id)));
      },
      (e) => {
        setDeleting(false);
        setDeleteTarget(null);
        let additionalText = "";
        if (e.message.includes("Нарушение ограничений")) additionalText = "\n" + e.message;
        enqueueSnackbar("Ошибка при удалении игры" + additionalText, {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const filterLabel = FILTER_OPTIONS.find((option) => option.value === filterTag)?.label ?? "";

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" noWrap component="h1">
            Пройденные игры
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              sx={{ minWidth: 220 }}
              label="Фильтр"
              value={filterTag}
              onChange={(event) => setFilterTag(event.target.value)}
            >
              {FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              onChange={(event) => setFilterInput(event.target.value)}
              value={filterInput}
              label={`Введите ${filterLabel.toLowerCase()}`}
              variant="outlined"
            />
          </Stack>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 900 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID игры</TableCell>
                  <TableCell>Логин игрока</TableCell>
                  <TableCell>ФИО игрока</TableCell>
                  <TableCell>ID игрока</TableCell>
                  <TableCell>Набор параметров</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Время добавления</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched && filteredData !== null ? (
                  filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        Игры не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((graph) => (
                      <TableRow key={graph.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ width: 75 }}>
                          <ImageButton onClick={() => setDeleteTarget(graph)}>
                            <DeleteIcon />
                          </ImageButton>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {graph.id}
                        </TableCell>
                        <TableCell>{graph.user_login || "—"}</TableCell>
                        <TableCell>{graph.user_name || "—"}</TableCell>
                        <TableCell>{graph.user_id}</TableCell>
                        <TableCell>
                          {graph.par_set_name?.trim()
                            ? `${graph.par_set_name} (№${graph.parameter_set_id})`
                            : `№${graph.parameter_set_id}`}
                        </TableCell>
                        <TableCell>{graph.is_training ? "Тренировка" : "Игра"}</TableCell>
                        <TableCell>{dateFormat(graph.created_at, "yyyy-mm-dd HH:MM:ss")}</TableCell>
                      </TableRow>
                    ))
                  )
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

        <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Удалить игру?</DialogTitle>
          <DialogContent>
            <Typography>
              Удалить игру №{deleteTarget?.id}
              {deleteTarget?.user_name ? ` игрока ${deleteTarget.user_name}` : ""}? Все точки и события
              этой сессии будут удалены безвозвратно.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Отмена</Button>
            <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminGraph;
