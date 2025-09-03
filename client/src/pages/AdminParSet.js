import React, { useEffect, useState } from "react";
import dateFormat from "dateformat";
import {
  Box,
  Button,
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

const AdminParset = () => {
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const [gainCoef, setGainCoef] = React.useState(-1);
  const [timeConst, setTimeConst] = React.useState(-1);
  const [noiseMean, setNoiseMean] = React.useState(-1);
  const [noiseStdev, setNoiseStdev] = React.useState(-1);
  const [falseWarningProb, setFalseWarningProb] = React.useState(-1);
  const [missingDangerProb, setMissingDangerProb] = React.useState(-1);

  const [updateTrigger, setUpdateTrigger] = useState(false);

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setIsDataFetched(false);
    getParSetsUI().then(() => {
      setIsDataFetched(true);
    });
  }, [page, updateTrigger]);

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts]);

    const addParSet = () => {
      let snackErrors = [];
      if (gainCoef === -1) {
        snackErrors.push("Введите коэффициент усиления");
      }
      if (timeConst === -1) {
        snackErrors.push("Введите константу времени");
      }
      if (noiseMean === -1) {
        snackErrors.push("Введите математическое ожидание помехи");
      }
      if (noiseStdev === -1) {
        snackErrors.push("Введите стандартное отклонение помехи");
      }
      if (falseWarningProb === -1) {
        snackErrors.push("Введите вероятность ложной тревоги");
      }
      if (missingDangerProb === -1) {
        snackErrors.push("Введите вероятность пропуска цели");
      }
      if (snackErrors.length !== 0) {
        setSnackErrTexts(snackErrors);
        return;
      }
  
      createParSet(gainCoef, timeConst, noiseMean, noiseStdev, falseWarningProb, missingDangerProb).then(
        (_) => {
          enqueueSnackbar("Пользователь добавлен", {
            variant: "success",
            autoHideDuration: 3000,
            preventDuplicate: true,
          });
          setGainCoef(-1);
          setTimeConst(-1);
          setNoiseMean(-1);
          setNoiseStdev(-1);
          setFalseWarningProb(-1);
          setMissingDangerProb(-1);
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

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" noWrap component="div">
            Добавление набора параметров
          </Typography>
          <TextField
            onChange={(event) => {setGainCoef(event.target.value);}}
            value={gainCoef}
            id="gain-coef-field"
            label="Введите коэффициент усиления"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {setTimeConst(event.target.value);}}
            value={timeConst}
            id="time-const-field"
            label="Введите константу времени"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {setNoiseMean(event.target.value);}}
            value={noiseMean}
            id="noise-mean-field"
            label="Введите математическое ожидание помехи"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {setNoiseStdev(event.target.value);}}
            value={noiseStdev}
            id="noise-stdev-field"
            label="Введите стандартное отклонение помехи"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {setFalseWarningProb(event.target.value);}}
            value={falseWarningProb}
            id="false-warning-prob-field"
            label="Введите вероятность ложной тревоги"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {setMissingDangerProb(event.target.value);}}
            value={missingDangerProb}
            id="missing-danger-prob-field"
            label="Введите вероятность пропуска цели"
            required={true}
            variant="outlined"
          />
          <Button sx={{ width: "fit-content", height: "40px" }} variant="contained" onClick={() => {addParSet()}}>
            Добавить набор параметров
          </Button>

          <Typography variant="h4" noWrap component="div">
            Изменение набора параметров
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID</TableCell>
                  <TableCell>Коэффициент усиления</TableCell>
                  <TableCell>Константа времени</TableCell>
                  <TableCell>Математическое ожидание помехи</TableCell>
                  <TableCell>Стандартное отклонение помехи</TableCell>
                  <TableCell>Вероятность ложной тревоги</TableCell>
                  <TableCell>Вероятность пропуска цели</TableCell>
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
                      <TableCell>{parSet.gain_coef}</TableCell>
                      <TableCell>{parSet.time_const}</TableCell>
                      <TableCell>{parSet.noise_mean}</TableCell>
                      <TableCell>{parSet.noise_stdev}</TableCell>
                      <TableCell>{parSet.false_warning_prob}</TableCell>
                      <TableCell>{parSet.missing_danger_prob}</TableCell>
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
