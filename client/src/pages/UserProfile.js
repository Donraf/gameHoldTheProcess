import React, { useContext, useEffect, useState } from "react";
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
import { Context } from "../index";
import { useNavigate } from "react-router-dom";
import { HOME_ROUTE } from "../utils/constants";
import { observer } from "mobx-react-lite";
import { updateUser } from "../http/userAPI";
import { useSnackbar } from "notistack";
import { fetchGraphs, getGraphsPageCount } from "../http/graphAPI";
import ImageButton from "../components/ImageButton/ImageButton";
import DeleteIcon from "../components/icons/DeleteIcon";

const UserProfile = observer(() => {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const [updatePassword, setUpdatePassword] = useState("");
  const [updateRepeatPassword, setUpdateRepeatPassword] = useState("");

  const [updateTrigger, setUpdateTrigger] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filterInput, setFilterInput] = useState("");
  const [filteredData, setFilteredData] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

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

  const filterData = async (updatePage) => {
    let filteredDataFromQuery = await fetchGraphs("user_id", user.user.user_id, page);
    let newPageCount = await getGraphsPageCount("user_id", user.user.user_id);
    setPageCount(newPageCount);
    if (updatePage) setPage(1);
    setFilteredData(filteredDataFromQuery);
  };

  const updateUserUi = () => {
    let snackErrors = [];
    if (updatePassword === "") {
      snackErrors.push("Введите новый пароль");
    } else if (updatePassword !== updateRepeatPassword) {
      snackErrors.push("Введенные пароли не совпадают");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    let updateInfo = {};
    updateInfo.password = updatePassword;
    updateUser(user.user.user_id, updateInfo).then(
      (_) => {
        enqueueSnackbar("Пароль обновлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setUpdatePassword("");
        setUpdateRepeatPassword("");
        setUpdateTrigger(!updateTrigger);
      },
      (_) => {
        enqueueSnackbar("Ошибка при обновлении пароля", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      {user.isAuth ? (
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
          <Toolbar />
          <Stack width={"100%"} direction="column" spacing={1}>
            <Typography variant="h4" component="div">
              Изменение пароля
            </Typography>
            <TextField
              onChange={(event) => {
                setUpdatePassword(event.target.value);
              }}
              value={updatePassword}
              id="outlined-basic"
              label="Введите новый пароль"
              variant="outlined"
            />
            <TextField
              onChange={(event) => {
                setUpdateRepeatPassword(event.target.value);
              }}
              value={updateRepeatPassword}
              id="outlined-basic"
              label="Повторите новый пароль"
              variant="outlined"
            />
            <Button
              sx={{ width: "fit-content", height: "40px" }}
              variant="contained"
              onClick={() => {
                updateUserUi();
              }}
            >
              Обновить пароль
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
          <Toolbar />
          <Typography variant="h4" component="div">
            Зарегистрируйтесь, чтобы посмотреть свой профиль.
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export default UserProfile;
