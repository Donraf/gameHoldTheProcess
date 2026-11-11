import React, { useCallback, useContext, useEffect, useState } from "react";
import { USER_ROLE_ADMIN, USER_ROLE_RESEARCHER, USER_ROLE_USER, USER_GENDER_FEMALE, USER_GENDER_MALE } from "../utils/constants";
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
import { Context } from "../index";
import { createUser, deleteUser, fetchUsers, getAllGroups, getUsersPageCount, updateUser } from "../http/userAPI";
import ImageButton from "../components/ImageButton/ImageButton";
import DeleteIcon from "../components/icons/DeleteIcon";
import EditIcon from "../components/icons/EditIcon";
import { useSnackbar } from "notistack";
import { useSearchParams } from "react-router-dom";

const AdminUser = () => {
  const { user: userStore } = useContext(Context);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [experienceMonths, setExperienceMonths] = useState("0");
  const [gender, setGender] = useState(USER_GENDER_MALE);
  const [age, setAge] = useState("");
  const [role, setRole] = useState(USER_ROLE_USER);
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [updatePassword, setUpdatePassword] = useState("");
  const [updateRole, setUpdateRole] = useState(USER_ROLE_USER);
  const [editUser, setEditUser] = useState(null);

  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const filterData = useCallback(async () => {
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
  }, [qGroupName, qPage]);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    setIsDataFetched(false);
    filterData().then(() => {
      setIsDataFetched(true);
    });
  }, [searchParams, filterData]);

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts, enqueueSnackbar]);

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
    if (profession.trim() === "") {
      snackErrors.push("Введите профессию пользователя");
    }
    if (experienceYears === "" || Number(experienceYears) < 0) {
      snackErrors.push("Введите корректный стаж пользователя");
    }
    if (experienceMonths === "" || Number(experienceMonths) < 0 || Number(experienceMonths) > 11) {
      snackErrors.push("Введите корректный стаж пользователя в месяцах (0-11)");
    }
    if (age === "" || Number(age) <= 0 || Number(age) > 150) {
      snackErrors.push("Введите корректный возраст пользователя");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    let groupId = null;
    if (selectedGroup !== "") {
      groupId = selectedGroup.id;
    }

    createUser(login, password, name, role, {
      profession: profession.trim(),
      experienceYears: Number(experienceYears),
      experienceMonths: Number(experienceMonths),
      gender,
      age: Number(age),
    }, groupId).then(
      (_) => {
        enqueueSnackbar("Пользователь добавлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setLogin("");
        setPassword("");
        setName("");
        setProfession("");
        setExperienceYears("");
        setExperienceMonths("0");
        setGender(USER_GENDER_MALE);
        setAge("");
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
        const serverError = e.response?.data?.error;
        enqueueSnackbar("Ошибка при удалении пользователя" + (serverError ? `: ${serverError}` : ""), {
          variant: "error",
          autoHideDuration: 4000,
          preventDuplicate: true,
        });
      }
    );
  };

  const handleDeleteOpen = (user) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteTarget(null);
    setDeleteOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTarget != null) {
      deleteUserUi(deleteTarget.user_id);
    }
    handleDeleteClose();
  };

  const updateUserUi = (id) => {
    let snackErrors = [];
    const roleChanged = editUser != null && updateRole !== editUser.role;
    if (updatePassword === "" && !roleChanged) {
      snackErrors.push("Нечего изменять: задайте новый пароль или новую роль");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    let updateInfo = {};
    if (updatePassword) {
      updateInfo.password = updatePassword;
    }
    if (roleChanged) {
      updateInfo.role = updateRole;
    }
    updateUser(id, updateInfo).then(
      (_) => {
        enqueueSnackbar("Пользователь обновлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        handleClose();
        setSearchParams({ group_name: qGroupName, page: qPage });
      },
      (e) => {
        const serverError = e.response?.data?.error;
        enqueueSnackbar("Ошибка при обновлении пользователя" + (serverError ? `: ${serverError}` : ""), {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const handleClickOpen = (user) => {
    setCurrentId(user.user_id);
    setEditUser(user);
    setUpdateRole(user.role);
    setOpen(true);
  };

  const handleClose = () => {
    setCurrentId(0);
    setEditUser(null);
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
              setProfession(event.target.value);
            }}
            value={profession}
            id="profession-field"
            label="Профессия"
            required={true}
            variant="outlined"
          />
          <TextField
            type="number"
            inputProps={{ min: 0 }}
            onChange={(event) => {
              setExperienceYears(event.target.value);
            }}
            value={experienceYears}
            id="experience-field"
            label="Стаж (лет)"
            helperText="Можно указать 0 — без стажа"
            required={true}
            variant="outlined"
          />
          <TextField
            type="number"
            inputProps={{ min: 0, max: 11 }}
            onChange={(event) => {
              setExperienceMonths(event.target.value);
            }}
            value={experienceMonths}
            id="experience-months-field"
            label="Стаж (месяцев, 0-11)"
            required={true}
            variant="outlined"
          />
          <TextField
            select
            value={gender}
            onChange={(event) => {
              setGender(event.target.value);
            }}
            id="gender-select"
            label="Пол"
            required={true}
            variant="outlined"
          >
            <MenuItem value={USER_GENDER_MALE}>{USER_GENDER_MALE}</MenuItem>
            <MenuItem value={USER_GENDER_FEMALE}>{USER_GENDER_FEMALE}</MenuItem>
          </TextField>
          <TextField
            type="number"
            inputProps={{ min: 1, max: 150 }}
            onChange={(event) => {
              setAge(event.target.value);
            }}
            value={age}
            id="age-field"
            label="Возраст"
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
                            disabled={user.user_id === userStore.user.user_id}
                            onClick={() => {
                              handleDeleteOpen(user);
                            }}
                          >
                            <DeleteIcon />
                          </ImageButton>
                          <ImageButton
                            onClick={() => {
                              handleClickOpen(user);
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
          <DialogContentText>
            {editUser != null ? `${editUser.login} (${editUser.name}). Введите новые данные в поля, которые хотите изменить.` : ""}
          </DialogContentText>
          <Stack width={"100%"} direction="column" spacing={2}>
            <TextField
              onChange={(event) => {
                setUpdatePassword(event.target.value);
              }}
              value={updatePassword}
              id="update-password-field"
              label="Новый пароль (оставьте пустым, чтобы не менять)"
              type="password"
              autoComplete="new-password"
              variant="outlined"
            />
            <TextField
              select
              value={updateRole}
              onChange={(event) => {
                setUpdateRole(event.target.value);
              }}
              id="update-role-select"
              label="Роль"
              helperText={
                editUser != null && updateRole === editUser.role
                  ? "Измените роль, иначе она не будет отправлена"
                  : "Текущая роль: " + (editUser != null ? roleNameMap.get(editUser.role) : "")
              }
              variant="outlined"
            >
              {roleNameArr.map((item) => (
                <MenuItem key={item[0]} value={item[0]}>
                  {item[1]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={() => updateUserUi(currentId)} type="submit">
            Изменить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={handleDeleteClose}>
        <DialogTitle>Удалить пользователя?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget != null
              ? `Вы уверены, что хотите удалить пользователя "${deleteTarget.login}" (${deleteTarget.name})? Это действие необратимо и удалит все связанные с ним данные.`
              : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Отмена</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUser;
