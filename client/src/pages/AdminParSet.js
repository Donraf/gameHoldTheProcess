import React, { useEffect, useRef, useState } from "react";
import dateFormat from "dateformat";
import {
  Box,
  Button,
  Container,
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
import ImageButton from "../components/ImageButton/ImageButton";
import DeleteIcon from "../components/icons/DeleteIcon";
import { useSnackbar } from "notistack";
import { createParSet, getParSets, getParSetsPageCount } from "../http/graphAPI";
import { ChartData } from "../utils/ChartData";
import {
  DEFAULT_FALSE_ALARM_THRESHOLD,
  DEFAULT_HINT_COST,
  DEFAULT_SCORING_CONFIG,
} from "../features/game/constants/parSetDefaults";
import { isValidLocalizedNumber, parseLocalizedJson, parseLocalizedNumber } from "../utils/parseLocalizedNumber";
import {
  Chart as ChartJS,
  LineController,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";
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

function formatRulesText(rulesText) {
  if (!rulesText?.trim()) {
    return "Стандартные правила";
  }
  return rulesText;
}

const scrollableCellSx = {
  maxWidth: 320,
  verticalAlign: "top",
};

const scrollableBoxSx = {
  maxHeight: 160,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const AdminParset = () => {
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const [a, setA] = React.useState(-1);
  const [b, setB] = React.useState(-1);
  const [noiseMean, setNoiseMean] = React.useState(-1);
  const [noiseStdev, setNoiseStdev] = React.useState(-1);
  const [falseWarningProb, setFalseWarningProb] = React.useState(-1);
  const [missingDangerProb, setMissingDangerProb] = React.useState(-1);
  const [hintCost, setHintCost] = React.useState(DEFAULT_HINT_COST);
  const [falseAlarmThreshold, setFalseAlarmThreshold] = React.useState(DEFAULT_FALSE_ALARM_THRESHOLD);
  const [scoringConfig, setScoringConfig] = React.useState(JSON.stringify(DEFAULT_SCORING_CONFIG, null, 2));
  const [rulesText, setRulesText] = React.useState("");

  const [parSetShowTrigger, setParSetShowTrigger] = useState(false);
  const chartRef = useRef < ChartJS > null;
  const [chartData, setChartData] = useState(null);

  const [updateTrigger, setUpdateTrigger] = useState(false);

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setIsDataFetched(false);
    getParSetsUI().then(() => {
      setIsDataFetched(true);
    });
  }, [page, updateTrigger]);

  const triggerUpdateParSet = () => {
    setParSetShowTrigger((prevState) => {
      return !prevState;
    });
  };

  useEffect(() => {
    createChartData();
  }, [parSetShowTrigger]);

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts]);

  const isUnset = (value) => value === -1 || value === "-1" || value === "" || value == null;

  const addParSet = () => {
    let snackErrors = [];
    if (isUnset(a)) {
      snackErrors.push("Введите коэффициент усиления");
    } else if (!isValidLocalizedNumber(a) || parseLocalizedNumber(a) < 0) {
      snackErrors.push("Коэффициент a должен быть неотрицательным числом");
    }
    if (isUnset(b)) {
      snackErrors.push("Введите константу времени");
    } else if (!isValidLocalizedNumber(b) || parseLocalizedNumber(b) < 0) {
      snackErrors.push("Коэффициент b должен быть неотрицательным числом");
    }
    if (isUnset(noiseMean)) {
      snackErrors.push("Введите математическое ожидание помехи");
    } else if (!isValidLocalizedNumber(noiseMean) || parseLocalizedNumber(noiseMean) < 0) {
      snackErrors.push("Математическое ожидание помехи должно быть неотрицательным числом");
    }
    if (isUnset(noiseStdev)) {
      snackErrors.push("Введите стандартное отклонение помехи");
    } else if (!isValidLocalizedNumber(noiseStdev) || parseLocalizedNumber(noiseStdev) < 0) {
      snackErrors.push("Стандартное отклонение помехи должно быть неотрицательным числом");
    }
    if (isUnset(falseWarningProb)) {
      snackErrors.push("Введите вероятность ложной тревоги");
    } else if (!isValidLocalizedNumber(falseWarningProb) || parseLocalizedNumber(falseWarningProb) < 0) {
      snackErrors.push("Вероятность ложной тревоги должна быть неотрицательным числом");
    }
    if (isUnset(missingDangerProb)) {
      snackErrors.push("Введите вероятность пропуска цели");
    } else if (!isValidLocalizedNumber(missingDangerProb) || parseLocalizedNumber(missingDangerProb) < 0) {
      snackErrors.push("Вероятность пропуска цели должна быть неотрицательным числом");
    }
    let parsedScoringConfig;
    try {
      parsedScoringConfig = parseLocalizedJson(scoringConfig);
    } catch (e) {
      snackErrors.push("Конфигурация бонусов и штрафов должна быть валидным JSON");
    }
    const parsedHintCost = parseLocalizedNumber(hintCost);
    if (hintCost === "" || Number.isNaN(parsedHintCost) || parsedHintCost < 0) {
      snackErrors.push("Введите корректную стоимость подсказки");
    }
    const parsedFalseAlarmThreshold = parseLocalizedNumber(falseAlarmThreshold);
    if (
      falseAlarmThreshold === "" ||
      Number.isNaN(parsedFalseAlarmThreshold) ||
      parsedFalseAlarmThreshold <= 0 ||
      parsedFalseAlarmThreshold > 1
    ) {
      snackErrors.push("Порог ложной тревоги должен быть в диапазоне (0, 1]");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    createParSet({
      a: parseLocalizedNumber(a),
      b: parseLocalizedNumber(b),
      noise_mean: parseLocalizedNumber(noiseMean),
      noise_stdev: parseLocalizedNumber(noiseStdev),
      false_warning_prob: parseLocalizedNumber(falseWarningProb),
      missing_danger_prob: parseLocalizedNumber(missingDangerProb),
      scoring_config: parsedScoringConfig,
      hint_cost: parsedHintCost,
      false_alarm_threshold: parsedFalseAlarmThreshold,
      rules_text: rulesText,
    }).then(
      (_) => {
        enqueueSnackbar("Пользователь добавлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setA(-1);
        setB(-1);
        setNoiseMean(-1);
        setNoiseStdev(-1);
        setFalseWarningProb(-1);
        setMissingDangerProb(-1);
        setHintCost(DEFAULT_HINT_COST);
        setFalseAlarmThreshold(DEFAULT_FALSE_ALARM_THRESHOLD);
        setScoringConfig(JSON.stringify(DEFAULT_SCORING_CONFIG, null, 2));
        setRulesText("");
        setUpdateTrigger(!updateTrigger);
      },
      (_) => {
        enqueueSnackbar("Ошибка при добавлении пользователя", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const getParSetsUI = async () => {
    const filteredDataFromQuery = await getParSets();
    const newPageCount = await getParSetsPageCount();
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
  };

  function createChartData() {
    const parsedA = parseLocalizedNumber(a);
    const parsedB = parseLocalizedNumber(b);
    const parsedNoiseMean = parseLocalizedNumber(noiseMean);
    const parsedNoiseStdev = parseLocalizedNumber(noiseStdev);

    if (
      isUnset(a) ||
      isUnset(b) ||
      isUnset(noiseMean) ||
      isUnset(noiseStdev) ||
      parsedA < 0 ||
      parsedB < 0 ||
      parsedNoiseMean < 0 ||
      parsedNoiseStdev < 0
    ) {
      setChartData(null);
      return;
    }

    const parSet = {
      a: parsedA,
      b: parsedB,
      noise_mean: parsedNoiseMean,
      noise_stdev: parsedNoiseStdev,
      false_warning_prob: 0,
      missing_danger_prob: 0,
    };
    let newChartData = new ChartData(0);
    newChartData.setParSet(parSet);
    while (!newChartData.isCrashed() && newChartData.points.length <= 200) {
      newChartData.generateNextPoint();
    }
    setChartData(newChartData.fullData);
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Stack width={"100%"} direction="row" spacing={2}>
            <Stack width={"100%"} direction="column" spacing={2}>
              <Typography variant="h4" noWrap component="div">
                Добавление набора параметров
              </Typography>
              <TextField
                onChange={(event) => {
                  setA(event.target.value);
                }}
                value={a}
                id="a-coef-field"
                label="Введите коэффициент a"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => {
                  setB(event.target.value);
                }}
                value={b}
                id="b-coef-field"
                label="Введите коэффициент b"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => {
                  setNoiseMean(event.target.value);
                }}
                value={noiseMean}
                id="noise-mean-field"
                label="Введите математическое ожидание помехи"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => {
                  setNoiseStdev(event.target.value);
                }}
                value={noiseStdev}
                id="noise-stdev-field"
                label="Введите стандартное отклонение помехи"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => {
                  setFalseWarningProb(event.target.value);
                }}
                value={falseWarningProb}
                id="false-warning-prob-field"
                label="Введите вероятность ложной тревоги"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => {
                  setMissingDangerProb(event.target.value);
                }}
                value={missingDangerProb}
                id="missing-danger-prob-field"
                label="Введите вероятность пропуска цели"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => setHintCost(event.target.value)}
                value={hintCost}
                id="hint-cost-field"
                label="Стоимость подсказки (кнопка)"
                required={true}
                variant="outlined"
              />
              <TextField
                onChange={(event) => setFalseAlarmThreshold(event.target.value)}
                value={falseAlarmThreshold}
                id="false-alarm-threshold-field"
                label="Порог ложной тревоги (falseAlarmThreshold)"
                required={true}
                variant="outlined"
                helperText="Можно вводить 0.9 или 0,9"
              />
              <TextField
                onChange={(event) => setScoringConfig(event.target.value)}
                value={scoringConfig}
                id="scoring-config-field"
                label="Бонусы и штрафы (JSON)"
                multiline
                minRows={8}
                required={true}
                variant="outlined"
                helperText="В числах допустимы и точка, и запятая как разделитель дробной части"
              />
              <TextField
                onChange={(event) => setRulesText(event.target.value)}
                value={rulesText}
                id="rules-text-field"
                label="Текст правил игры"
                multiline
                minRows={8}
                variant="outlined"
                helperText="Пустое поле — стандартные правила. Сложная таблица: HTML <table> с colspan и rowspan"
              />
            </Stack>

            <Container>
              {chartData !== null ? <Chart ref={chartRef} options={options} data={chartData} /> : <></>}
            </Container>
          </Stack>

          <Button
            sx={{ width: "fit-content", height: "40px" }}
            variant="contained"
            onClick={() => {
              addParSet();
            }}
          >
            Добавить набор параметров
          </Button>

          <Button
            sx={{ width: "fit-content", height: "40px" }}
            variant="contained"
            onClick={() => {
              triggerUpdateParSet();
            }}
          >
            Посмотреть возможный ход процесса
          </Button>

          <Typography variant="h4" noWrap component="div">
            Изменение набора параметров
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 1400 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID</TableCell>
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
                {isDataFetched ? (
                  filteredData.map((parSet) => (
                    <TableRow key={parSet.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell sx={{ width: 75 }}>
                        <Stack direction="row" spacing={1}>
                          <ImageButton onClick={() => {}}>
                            <DeleteIcon />
                          </ImageButton>
                        </Stack>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {parSet.id}
                      </TableCell>
                      <TableCell>{parSet.a}</TableCell>
                      <TableCell>{parSet.b}</TableCell>
                      <TableCell>{parSet.noise_mean}</TableCell>
                      <TableCell>{parSet.noise_stdev}</TableCell>
                      <TableCell>{parSet.false_warning_prob}</TableCell>
                      <TableCell>{parSet.missing_danger_prob}</TableCell>
                      <TableCell>{parSet.hint_cost}</TableCell>
                      <TableCell>{parSet.false_alarm_threshold}</TableCell>
                      <TableCell sx={scrollableCellSx}>
                        <Box sx={{ ...scrollableBoxSx, fontFamily: "monospace", fontSize: 12 }}>
                          {formatScoringConfig(parSet.scoring_config)}
                        </Box>
                      </TableCell>
                      <TableCell sx={scrollableCellSx}>
                        <Box sx={{ ...scrollableBoxSx, fontSize: 13 }}>{formatRulesText(parSet.rules_text)}</Box>
                      </TableCell>
                      <TableCell>{dateFormat(parSet.created_at, "yyyy-mm-dd HH:MM:ss")}</TableCell>
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

export default AdminParset;
