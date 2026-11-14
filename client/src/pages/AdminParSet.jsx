import React, { useCallback, useEffect, useRef, useState } from "react";
import dateFormat from "dateformat";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import EditIcon from "../components/icons/EditIcon";
import { useSnackbar } from "notistack";
import { createParSet, deleteParSet, getParSets, getParSetsPageCount, updateParSet } from "../http/graphAPI";
import { ChartData } from "../utils/ChartData";
import {
  DEFAULT_FALSE_ALARM_THRESHOLD,
  DEFAULT_HINT_COST,
  DEFAULT_SCORING_CONFIG,
} from "../features/game/constants/parSetDefaults";
import { isValidLocalizedNumber, parseLocalizedJson, parseLocalizedNumber } from "../utils/parseLocalizedNumber";
import { parSetLabel } from "../utils/parSet";
import { Chart } from "react-chartjs-2";

const options = {
  animations: {
    x: {
      duration: 1000,
    },
    y: {
      duration: 0,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      min: 0,
      max: 1,
    },
  },
  plugins: {
    legend: false,
  },
};

const PREVIEW_LENGTH = 80;

const emptyForm = {
  name: "",
  a: "",
  b: "",
  noiseMean: "",
  noiseStdev: "",
  falseWarningProb: "",
  missingDangerProb: "",
  hintCost: DEFAULT_HINT_COST,
  falseAlarmThreshold: DEFAULT_FALSE_ALARM_THRESHOLD,
  scoringConfig: JSON.stringify(DEFAULT_SCORING_CONFIG, null, 2),
  rulesText: "",
};

function formFromParSet(parSet) {
  return {
    name: parSet.name ?? "",
    a: String(parSet.a),
    b: String(parSet.b),
    noiseMean: String(parSet.noise_mean),
    noiseStdev: String(parSet.noise_stdev),
    falseWarningProb: String(parSet.false_warning_prob),
    missingDangerProb: String(parSet.missing_danger_prob),
    hintCost: parSet.hint_cost ?? DEFAULT_HINT_COST,
    falseAlarmThreshold: parSet.false_alarm_threshold ?? DEFAULT_FALSE_ALARM_THRESHOLD,
    scoringConfig: formatScoringConfig(parSet.scoring_config),
    rulesText: parSet.rules_text ?? "",
  };
}

function formatScoringConfig(scoringConfig) {
  if (scoringConfig == null) {
    return "—";
  }

  try {
    const config = typeof scoringConfig === "string" ? JSON.parse(scoringConfig) : scoringConfig;
    return JSON.stringify(config, null, 2);
  } catch (e) {
    return String(scoringConfig);
  }
}

function validateForm(form) {
  if (form.name.trim() === "") {
    return "Введите название набора параметров";
  }
  if (form.a === "" || !isValidLocalizedNumber(form.a) || parseLocalizedNumber(form.a) < 0) {
    return "Коэффициент a должен быть неотрицательным числом";
  }
  if (form.b === "" || !isValidLocalizedNumber(form.b) || parseLocalizedNumber(form.b) < 0) {
    return "Коэффициент b должен быть неотрицательным числом";
  }
  if (form.noiseMean === "" || !isValidLocalizedNumber(form.noiseMean) || parseLocalizedNumber(form.noiseMean) < 0) {
    return "Математическое ожидание помехи должно быть неотрицательным числом";
  }
  if (form.noiseStdev === "" || !isValidLocalizedNumber(form.noiseStdev) || parseLocalizedNumber(form.noiseStdev) < 0) {
    return "Стандартное отклонение помехи должно быть неотрицательным числом";
  }
  if (
    form.falseWarningProb === "" ||
    !isValidLocalizedNumber(form.falseWarningProb) ||
    parseLocalizedNumber(form.falseWarningProb) < 0
  ) {
    return "Вероятность ложной тревоги должна быть неотрицательным числом";
  }
  if (
    form.missingDangerProb === "" ||
    !isValidLocalizedNumber(form.missingDangerProb) ||
    parseLocalizedNumber(form.missingDangerProb) < 0
  ) {
    return "Вероятность пропуска цели должна быть неотрицательным числом";
  }
  try {
    parseLocalizedJson(form.scoringConfig);
  } catch (e) {
    return "Конфигурация бонусов и штрафов должна быть валидным JSON";
  }
  const parsedHintCost = parseLocalizedNumber(form.hintCost);
  if (form.hintCost === "" || Number.isNaN(parsedHintCost) || parsedHintCost < 0) {
    return "Введите корректную стоимость подсказки";
  }
  const parsedFalseAlarmThreshold = parseLocalizedNumber(form.falseAlarmThreshold);
  if (
    form.falseAlarmThreshold === "" ||
    Number.isNaN(parsedFalseAlarmThreshold) ||
    parsedFalseAlarmThreshold <= 0 ||
    parsedFalseAlarmThreshold > 1
  ) {
    return "Порог ложной тревоги должен быть в диапазоне (0, 1]";
  }
  return null;
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    a: parseLocalizedNumber(form.a),
    b: parseLocalizedNumber(form.b),
    noise_mean: parseLocalizedNumber(form.noiseMean),
    noise_stdev: parseLocalizedNumber(form.noiseStdev),
    false_warning_prob: parseLocalizedNumber(form.falseWarningProb),
    missing_danger_prob: parseLocalizedNumber(form.missingDangerProb),
    scoring_config: parseLocalizedJson(form.scoringConfig),
    hint_cost: parseLocalizedNumber(form.hintCost),
    false_alarm_threshold: parseLocalizedNumber(form.falseAlarmThreshold),
    rules_text: form.rulesText,
  };
}

const ParSetFields = ({ values, onChange }) => {
  const field = (key, label, extraProps = {}) => (
    <TextField
      fullWidth
      label={label}
      variant="outlined"
      value={values[key]}
      onChange={(event) => onChange(key, event.target.value)}
      {...extraProps}
    />
  );

  return (
    <Stack width="100%" direction="column" spacing={2}>
      {field("name", "Название набора", { required: true })}
      {field("a", "Коэффициент a", { required: true })}
      {field("b", "Коэффициент b", { required: true })}
      {field("noiseMean", "Математическое ожидание помехи", { required: true })}
      {field("noiseStdev", "Стандартное отклонение помехи", { required: true })}
      {field("falseWarningProb", "Вероятность ложной тревоги", { required: true })}
      {field("missingDangerProb", "Вероятность пропуска цели", { required: true })}
      {field("hintCost", "Стоимость подсказки (кнопка)", { required: true })}
      {field("falseAlarmThreshold", "Порог ложной тревоги (falseAlarmThreshold)", {
        required: true,
        helperText: "Можно вводить 0.9 или 0,9",
      })}
      {field("scoringConfig", "Бонусы и штрафы (JSON)", {
        multiline: true,
        minRows: 8,
        required: true,
        helperText: "В числах допустимы и точка, и запятая как разделитель дробной части",
      })}
      {field("rulesText", "Текст правил игры", {
        multiline: true,
        minRows: 8,
        helperText: "Пустое поле — стандартные правила. Сложная таблица: HTML <table> с colspan и rowspan",
      })}
    </Stack>
  );
};

const PreviewCell = ({ text, monospace, onOpen }) => {
  const content = text ?? "";
  const isLong = content.length > PREVIEW_LENGTH;
  return (
    <Box sx={{ fontFamily: monospace ? "monospace" : "inherit", fontSize: monospace ? 12 : 13 }}>
      {isLong ? content.slice(0, PREVIEW_LENGTH) + "…" : content || "—"}{" "}
      {isLong ? (
        <Button size="small" onClick={onOpen}>
          Показать
        </Button>
      ) : null}
    </Box>
  );
};

const AdminParset = () => {
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [updating, setUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [viewContent, setViewContent] = useState(null);

  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);

  const [updateTrigger, setUpdateTrigger] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const notifyError = (text) =>
    enqueueSnackbar(text, { variant: "error", autoHideDuration: 4000, preventDuplicate: true });

  const getParSetsUI = useCallback(async () => {
    const filteredDataFromQuery = await getParSets(page);
    const newPageCount = await getParSetsPageCount();
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
  }, [page]);

  useEffect(() => {
    setIsDataFetched(false);
    getParSetsUI().then(() => {
      setIsDataFetched(true);
    });
  }, [page, updateTrigger, getParSetsUI]);

  const showPreview = () => {
    if (validateForm(createForm) !== null) {
      setChartData(null);
      notifyError("Заполните параметры корректно, чтобы посмотреть ход процесса");
      return;
    }

    const parSet = {
      a: parseLocalizedNumber(createForm.a),
      b: parseLocalizedNumber(createForm.b),
      noise_mean: parseLocalizedNumber(createForm.noiseMean),
      noise_stdev: parseLocalizedNumber(createForm.noiseStdev),
      false_warning_prob: parseLocalizedNumber(createForm.falseWarningProb),
      missing_danger_prob: parseLocalizedNumber(createForm.missingDangerProb),
    };
    let newChartData = new ChartData(0);
    newChartData.setParSet(parSet);
    while (!newChartData.isCrashed() && newChartData.points.length <= 200) {
      newChartData.generateNextPoint();
    }
    setChartData(newChartData.getFullData());
  };

  const addParSet = () => {
    const validationError = validateForm(createForm);
    if (validationError) {
      notifyError(validationError);
      return;
    }
    if (creating) {
      return;
    }

    setCreating(true);
    createParSet(buildPayload(createForm)).then(
      () => {
        setCreating(false);
        enqueueSnackbar("Набор параметров добавлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setCreateForm(emptyForm);
        setUpdateTrigger(!updateTrigger);
      },
      () => {
        setCreating(false);
        notifyError("Ошибка при добавлении набора параметров");
      }
    );
  };

  const openEditDialog = (parSet) => {
    setEditTarget(parSet);
    setEditForm(formFromParSet(parSet));
  };

  const closeEditDialog = () => {
    setEditTarget(null);
    setUpdating(false);
  };

  const saveParSet = () => {
    const validationError = validateForm(editForm);
    if (validationError) {
      notifyError(validationError);
      return;
    }
    if (updating) {
      return;
    }

    setUpdating(true);
    updateParSet(editTarget.id, buildPayload(editForm)).then(
      () => {
        setUpdating(false);
        enqueueSnackbar("Набор параметров обновлён", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        closeEditDialog();
        setUpdateTrigger(!updateTrigger);
      },
      () => {
        setUpdating(false);
        notifyError("Ошибка при обновлении набора параметров");
      }
    );
  };

  const confirmDelete = () => {
    if (deleting || deleteTarget == null) {
      return;
    }

    setDeleting(true);
    deleteParSet(deleteTarget.id).then(
      () => {
        setDeleting(false);
        setDeleteTarget(null);
        enqueueSnackbar("Набор параметров удалён", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setUpdateTrigger(!updateTrigger);
      },
      (e) => {
        setDeleting(false);
        setDeleteTarget(null);
        if (e.response && e.response.status === 409) {
          notifyError("Набор используется (пользователями, группами или играми) и не может быть удалён");
        } else {
          notifyError("Ошибка при удалении набора параметров");
        }
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
          <Stack width={"100%"} direction="row" spacing={2}>
            <Stack width={"100%"} direction="column" spacing={2}>
              <Typography variant="h4" component="h2">
                Добавление набора параметров
              </Typography>
              <ParSetFields
                values={createForm}
                onChange={(key, value) => setCreateForm((prev) => ({ ...prev, [key]: value }))}
              />
            </Stack>

            <Container>
              {chartData !== null ? <Chart ref={chartRef} options={options} data={chartData} /> : <></>}
            </Container>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              sx={{ width: "fit-content", height: 40 }}
              variant="contained"
              disabled={creating}
              onClick={addParSet}
            >
              {creating ? "Добавление..." : "Добавить набор параметров"}
            </Button>
            <Button
              sx={{ width: "fit-content", height: 40 }}
              variant="outlined"
              onClick={showPreview}
            >
              Посмотреть возможный ход процесса
            </Button>
          </Stack>

          <Typography variant="h4" component="h1">
            Наборы параметров
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader sx={{ minWidth: 1400 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Коэффициент a</TableCell>
                  <TableCell>Коэффициент b</TableCell>
                  <TableCell>Математическое ожидание помехи</TableCell>
                  <TableCell>Стандартное отклонение помехи</TableCell>
                  <TableCell>Вероятность ложной тревоги</TableCell>
                  <TableCell>Вероятность пропуска цели</TableCell>
                  <TableCell>Стоимость подсказки</TableCell>
                  <TableCell>Порог ложной тревоги</TableCell>
                  <TableCell>Бонусы и штрафы</TableCell>
                  <TableCell>Текст правил игры</TableCell>
                  <TableCell>Время добавления</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched && filteredData !== null ? (
                  filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} align="center" sx={{ py: 6 }}>
                        Наборы параметров не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((parSet) => (
                      <TableRow key={parSet.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ width: 110 }}>
                          <Stack direction="row" spacing={1}>
                            <ImageButton onClick={() => openEditDialog(parSet)}>
                              <EditIcon />
                            </ImageButton>
                            <ImageButton onClick={() => setDeleteTarget(parSet)}>
                              <DeleteIcon />
                            </ImageButton>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {parSet.id}
                        </TableCell>
                        <TableCell>{parSet.name?.trim() || "—"}</TableCell>
                        <TableCell>{parSet.a}</TableCell>
                        <TableCell>{parSet.b}</TableCell>
                        <TableCell>{parSet.noise_mean}</TableCell>
                        <TableCell>{parSet.noise_stdev}</TableCell>
                        <TableCell>{parSet.false_warning_prob}</TableCell>
                        <TableCell>{parSet.missing_danger_prob}</TableCell>
                        <TableCell>{parSet.hint_cost}</TableCell>
                        <TableCell>{parSet.false_alarm_threshold}</TableCell>
                        <TableCell>
                          <PreviewCell
                            text={formatScoringConfig(parSet.scoring_config)}
                            monospace
                            onOpen={() =>
                              setViewContent({
                                title: `Бонусы и штрафы — ${parSetLabel(parSet)}`,
                                content: formatScoringConfig(parSet.scoring_config),
                                monospace: true,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <PreviewCell
                            text={parSet.rules_text?.trim() ? parSet.rules_text : "Стандартные правила"}
                            onOpen={() =>
                              setViewContent({
                                title: `Правила игры — ${parSetLabel(parSet)}`,
                                content: parSet.rules_text?.trim() ? parSet.rules_text : "Стандартные правила",
                                monospace: false,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>{dateFormat(parSet.created_at, "yyyy-mm-dd HH:MM:ss")}</TableCell>
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
        </Stack>

        <Dialog open={editTarget !== null} onClose={closeEditDialog} maxWidth="md" fullWidth>
          <DialogTitle>Изменение набора параметров {parSetLabel(editTarget)}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <ParSetFields
                values={editForm}
                onChange={(key, value) => setEditForm((prev) => ({ ...prev, [key]: value }))}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Отмена</Button>
            <Button variant="contained" onClick={saveParSet} disabled={updating}>
              {updating ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Удалить набор параметров?</DialogTitle>
          <DialogContent>
            <Typography>
              Удалить набор параметров {parSetLabel(deleteTarget)}? Если набор используется пользователями,
              группами или в сыгранных играх, удаление будет отклонено.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Отмена</Button>
            <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={viewContent !== null} onClose={() => setViewContent(null)} maxWidth="md" fullWidth>
          <DialogTitle>{viewContent?.title}</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: viewContent?.monospace ? "monospace" : "inherit",
                fontSize: viewContent?.monospace ? 13 : 15,
              }}
            >
              {viewContent?.content}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewContent(null)}>Закрыть</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminParset;
