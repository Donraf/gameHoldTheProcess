import React, { useEffect, useState } from "react";
import { USER_ROLE_ADMIN, USER_ROLE_RESEARCHER, USER_ROLE_USER } from "../utils/constants";
import {
  Autocomplete,
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Switch,
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
import { createUser, deleteUser, fetchUsers, getAllGroups, getUsersPageCount, updateUser } from "../http/userAPI";
import ImageButton from "../components/ImageButton/ImageButton";
import DeleteIcon from "../components/icons/DeleteIcon";
import EditIcon from "../components/icons/EditIcon";
import { useSnackbar } from "notistack";
import { useSearchParams } from "react-router-dom";

const AdminUser = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(USER_ROLE_USER);
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [updatePassword, setUpdatePassword] = useState("");
  const [updateRole, setUpdateRole] = useState(USER_ROLE_USER);

  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [open, setOpen] = React.useState(false);
  const [currentId, setCurrentId] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  var qGroupName = searchParams.get("group_name");
  var qPage = searchParams.get("page");

  const [selectedGroupName, setSelectedGroupName] = useState(qGroupName);

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const roleNameArr = [
    [USER_ROLE_USER, "Пользователь"],
    [USER_ROLE_ADMIN, "Администратор"],
    [USER_ROLE_RESEARCHER, "Исследователь"],
  ];
  const roleNameMap = new Map(roleNameArr);

  const fetchGroups = () => {
    getAllGroups().then((data) => {
      setFetchedGroups(data);
    });
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    setIsDataFetched(false);
    filterData().then(() => {
      setIsDataFetched(true);
    });
  }, [searchParams]);

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts]);

  const addUser = () => {
    let snackErrors = [];
    if (login === "") {
      snackErrors.push("Введите логин пользователя");
    }
    if (password === "") {
      snackErrors.push("Введите пароль пользователя");
    }
    if (name === "") {
      snackErrors.push("Введите ФИО пользователя");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    let groupId = null;
    if (selectedGroup !== "") {
      groupId = selectedGroup.id;
    }

    createUser(login, password, name, role, groupId).then(
      (_) => {
        enqueueSnackbar("Пользователь добавлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setLogin("");
        setPassword("");
        setName("");
        setRole(USER_ROLE_USER);
        setSelectedGroup("");
        setSearchParams({ group_name: qGroupName, page: qPage });
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

  const deleteUserUi = (id) => {
    deleteUser(id).then(
      (_) => {
        enqueueSnackbar("Пользователь удален", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setSearchParams({ group_name: qGroupName, page: 1 });
      },
      (e) => {
        let additionalText = "";
        if (e.message.includes("Нарушение ограничений")) additionalText = "\n" + e.message;
        enqueueSnackbar("Ошибка при удалении пользователя" + additionalText, {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const updateUserUi = (id) => {
    let snackErrors = [];
    if (updatePassword === "") {
      snackErrors.push("Введите информацию, которую нужно изменить");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    let updateInfo = {};
    if (updatePassword) {
      updateInfo.password = updatePassword;
    }
    if (updateRole) {
      updateInfo.role = updateRole;
    }
    updateUser(id, updateInfo).then(
      (_) => {
        enqueueSnackbar("Пользователь обновлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setUpdatePassword("");
        setUpdateRole(USER_ROLE_USER);
        setSearchParams({ group_name: qGroupName, page: qPage });
      },
      (_) => {
        enqueueSnackbar("Ошибка при обновлении пользователя", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const filterData = async () => {
    let filteredDataFromQuery;
    let newPageCount;
    if (qGroupName) {
      filteredDataFromQuery = await fetchUsers("group_name", qGroupName, parseInt(qPage));
      newPageCount = await getUsersPageCount("group_name", qGroupName);
    } else {
      filteredDataFromQuery = await fetchUsers(null, null, parseInt(qPage));
      newPageCount = await getUsersPageCount();
    }
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
  };

  const handleClickOpen = (id) => {
    setCurrentId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setCurrentId(0);
    setUpdatePassword("");
    setUpdateRole(USER_ROLE_USER);
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Typography variant="h4" noWrap component="div">
            Добавление нового пользователя
          </Typography>
          <TextField
            onChange={(event) => {
              setLogin(event.target.value);
            }}
            value={login}
            id="login-field"
            label="Введите логин пользователя"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {
              setName(event.target.value);
            }}
            value={name}
            id="name-field"
            label="Введите ФИО пользователя"
            required={true}
            variant="outlined"
          />
          <TextField
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            value={password}
            id="password-field"
            label="Введите пароль пользователя"
            required={true}
            variant="outlined"
          />
          <TextField
            select
            value={role}
            onChange={(event) => {
              const newRole = event.target.value;
              setRole(newRole);
            }}
            id="role-select"
            variant={"outlined"}
          >
            {roleNameArr.map((item, i) => (
              <MenuItem id={"roleItem" + i} value={item[0]}>
                {item[1]}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            options={fetchedGroups}
            getOptionLabel={(group) => group.name}
            renderInput={(params) => <TextField {...params} label="Выберите группу" />}
            value={fetchedGroups.find((group) => group.name === selectedGroup.name) || null}
            onChange={(_, newValue) => {
              const newSelectedGroup = newValue;
              setSelectedGroup(newSelectedGroup);
            }}
            sx={{
              flexGrow: 9,
            }}
          />
          <Button
            sx={{ width: "fit-content", height: "40px" }}
            variant="contained"
            onClick={() => {
              addUser();
            }}
          >
            Добавить пользователя
          </Button>

          <Typography variant="h4" noWrap component="div">
            Изменение пользователя
          </Typography>
          <Autocomplete
            options={fetchedGroups}
            getOptionLabel={(group) => group.name}
            renderInput={(params) => <TextField {...params} label="Выберите группу" />}
            value={fetchedGroups.find((group) => group.name === selectedGroupName) || null}
            onChange={(_, newValue) => {
              const newSelectedGroupName = newValue ? newValue.name : "";
              setSelectedGroupName(newSelectedGroupName);
              setSearchParams({ group_name: newSelectedGroupName, page: 1 });
            }}
            sx={{
              flexGrow: 9,
            }}
          />

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Логин</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>ФИО</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched ? (
                  filteredData.map((user) => (
                    <TableRow key={user.user_id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell sx={{ width: 75 }}>
                        <Stack direction="row" spacing={1}>
                          <ImageButton
                            onClick={() => {
                              deleteUserUi(user.user_id);
                            }}
                          >
                            <DeleteIcon />
                          </ImageButton>
                          <ImageButton
                            onClick={() => {
                              handleClickOpen(user.user_id);
                            }}
                          >
                            <EditIcon />
                          </ImageButton>
                        </Stack>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {user.login}
                      </TableCell>
                      <TableCell>{roleNameMap.get(user.role)}</TableCell>
                      <TableCell component="th" scope="row">
                        {user.name}
                      </TableCell>
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
              page={parseInt(qPage)}
              onChange={(event, value) => {
                setSearchParams({ group_name: qGroupName, page: value });
              }}
              variant="outlined"
              shape="rounded"
            />
          ) : (
            <></>
          )}
        </Stack>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Изменить пользователя</DialogTitle>
        <DialogContent>
          <DialogContentText>Введите новые данные в поля, которые хотите изменить.</DialogContentText>
          <Stack width={"100%"} direction="column" spacing={2}>
            <TextField
              onChange={(event) => {
                setUpdatePassword(event.target.value);
              }}
              value={updatePassword}
              id="outlined-basic"
              label="Введите пароль пользователя"
              variant="outlined"
            />
            <FormControlLabel
              control={
                <Switch
                  onChange={(event) => {
                    event.target.checked ? setUpdateRole(USER_ROLE_ADMIN) : setUpdateRole(USER_ROLE_USER);
                  }}
                />
              }
              label="Сделать администратором?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={() => updateUserUi(currentId)} type="submit">
            Изменить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUser;
