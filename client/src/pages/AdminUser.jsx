import React, { useCallback, useContext, useEffect, useState } from "react";
import { USER_ROLE_ADMIN, USER_ROLE_RESEARCHER, USER_ROLE_USER, USER_GENDER_FEMALE, USER_GENDER_MALE, MIN_PASSWORD_LENGTH } from "../utils/constants";
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
  TableSortLabel,
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

const SEARCH_FILTER_OPTIONS = [
  { value: "user_name", label: "ФИО" },
  { value: "login", label: "Логин" },
];

const DEBOUNCE_MS = 400;

const AdminUser = () => {
  const { user: userStore } = useContext(Context);

  // Форма создания (в модалке)
  const [createOpen, setCreateOpen] = useState(false);
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

  // Форма редактирования
  const [updatePassword, setUpdatePassword] = useState("");
  const [updateRole, setUpdateRole] = useState(USER_ROLE_USER);
  const [updateName, setUpdateName] = useState("");
  const [updateProfession, setUpdateProfession] = useState("");
  const [updateExperienceYears, setUpdateExperienceYears] = useState("");
  const [updateExperienceMonths, setUpdateExperienceMonths] = useState("");
  const [updateGender, setUpdateGender] = useState(USER_GENDER_MALE);
  const [updateAge, setUpdateAge] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentId, setCurrentId] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(1);

  // Поиск по логину/ФИО с дебаунсом
  const [searchTag, setSearchTag] = useState("user_name");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState({ tag: "user_name", value: "" });

  const [searchParams, setSearchParams] = useSearchParams();
  var qGroupName = searchParams.get("group_name");
  var qPage = searchParams.get("page");

  const [selectedGroupName, setSelectedGroupName] = useState(qGroupName);

  const [refreshTick, setRefreshTick] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const notifyError = (text) =>
    enqueueSnackbar(text, { variant: "error", autoHideDuration: 4000, preventDuplicate: true });

  const roleNameArr = [
    [USER_ROLE_USER, "Пользователь"],
    [USER_ROLE_ADMIN, "Администратор"],
    [USER_ROLE_RESEARCHER, "Исследователь"],
  ];
  const roleNameMap = new Map(roleNameArr);

  const headCells = [
    { id: "login", label: "Логин" },
    { id: "role", label: "Роль" },
    { id: "name", label: "ФИО" },
    { id: "profession", label: "Профессия" },
    { id: "experience", label: "Стаж" },
    { id: "age", label: "Возраст" },
  ];

  const sortBy = searchParams.get("sort_by") || "login";
  const sortDir = searchParams.get("sort_dir") === "desc" ? "desc" : "asc";

  const handleRequestSort = (columnId) => {
    const isAsc = sortBy === columnId && sortDir === "asc";
    setSearchParams({
      group_name: qGroupName,
      page: 1,
      sort_by: columnId,
      sort_dir: isAsc ? "desc" : "asc",
    });
  };

  const fetchGroups = () => {
    getAllGroups().then((data) => {
      setFetchedGroups(data);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch({ tag: searchTag, value: searchInput.trim() });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTag, searchInput]);

  // При смене поискового запроса возвращаемся на первую страницу.
  useEffect(() => {
    if (debouncedSearch.value !== "") {
      setSearchParams({ group_name: qGroupName, page: 1, sort_by: sortBy, sort_dir: sortDir });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filterData = useCallback(async () => {
    let filteredDataFromQuery;
    let newPageCount;
    const currentPage = parseInt(qPage) || 1;
    if (debouncedSearch.value !== "") {
      // Текстовый поиск имеет приоритет над фильтром по группе.
      filteredDataFromQuery = await fetchUsers(debouncedSearch.tag, debouncedSearch.value, currentPage, sortBy, sortDir);
      newPageCount = await getUsersPageCount(debouncedSearch.tag, debouncedSearch.value);
    } else if (qGroupName) {
      filteredDataFromQuery = await fetchUsers("group_name", qGroupName, currentPage, sortBy, sortDir);
      newPageCount = await getUsersPageCount("group_name", qGroupName);
    } else {
      filteredDataFromQuery = await fetchUsers(null, null, currentPage, sortBy, sortDir);
      newPageCount = await getUsersPageCount();
    }
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
  }, [qGroupName, qPage, sortBy, sortDir, debouncedSearch]);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    setIsDataFetched(false);
    filterData().then(() => {
      setIsDataFetched(true);
    });
  }, [searchParams, filterData, refreshTick]);

  const resetCreateForm = () => {
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
  };

  const handleCreateOpen = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
  };

  const addUser = () => {
    if (adding) {
      return;
    }
    if (login.trim() === "") {
      notifyError("Введите логин пользователя");
      return;
    }
    if (password === "") {
      notifyError("Введите пароль пользователя");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      notifyError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (name.trim() === "") {
      notifyError("Введите ФИО пользователя");
      return;
    }
    if (profession.trim() === "") {
      notifyError("Введите профессию пользователя");
      return;
    }
    if (experienceYears === "" || !Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0) {
      notifyError("Введите корректный стаж пользователя");
      return;
    }
    if (experienceMonths === "" || Number(experienceMonths) < 0 || Number(experienceMonths) > 11) {
      notifyError("Введите корректный стаж пользователя в месяцах (0-11)");
      return;
    }
    if (age === "" || Number(age) <= 0 || Number(age) > 150) {
      notifyError("Введите корректный возраст пользователя");
      return;
    }

    let groupId = null;
    if (selectedGroup !== "") {
      groupId = selectedGroup.id;
    }

    setAdding(true);
    createUser(login.trim(), password, name.trim(), role, {
      profession: profession.trim(),
      experienceYears: Number(experienceYears),
      experienceMonths: Number(experienceMonths),
      gender,
      age: Number(age),
    }, groupId).then(
      (_) => {
        setAdding(false);
        enqueueSnackbar("Пользователь добавлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        handleCreateClose();
        setRefreshTick((tick) => tick + 1);
      },
      (e) => {
        setAdding(false);
        const serverError = e.response?.data?.error;
        notifyError("Ошибка при добавлении пользователя" + (serverError ? `: ${serverError}` : ""));
      }
    );
  };

  const deleteUserUi = (id) => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    deleteUser(id).then(
      (_) => {
        setDeleting(false);
        enqueueSnackbar("Пользователь удален", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setSearchParams({ group_name: qGroupName, page: 1, sort_by: sortBy, sort_dir: sortDir });
        setRefreshTick((tick) => tick + 1);
      },
      (e) => {
        const serverError = e.response?.data?.error;
        notifyError("Ошибка при удалении пользователя" + (serverError ? `: ${serverError}` : ""));
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
    if (updating) {
      return;
    }

    const nameChanged = updateName.trim() !== "" && updateName.trim() !== (editUser?.name ?? "");
    const professionChanged =
      updateProfession.trim() !== "" && updateProfession.trim() !== (editUser?.profession ?? "");
    const yearsChanged =
      updateExperienceYears !== "" && Number(updateExperienceYears) !== (editUser?.experience_years ?? 0);
    const monthsChanged =
      updateExperienceMonths !== "" && Number(updateExperienceMonths) !== (editUser?.experience_months ?? 0);
    const genderChanged = updateGender !== (editUser?.gender ?? USER_GENDER_MALE);
    const ageChanged = updateAge !== "" && Number(updateAge) !== (editUser?.age ?? 0);
    const roleChanged = editUser != null && updateRole !== editUser.role;

    if (updatePassword !== "" && updatePassword.length < MIN_PASSWORD_LENGTH) {
      notifyError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (yearsChanged && Number(updateExperienceYears) < 0) {
      notifyError("Введите корректный стаж в годах (не меньше 0)");
      return;
    }
    if (monthsChanged && (Number(updateExperienceMonths) < 0 || Number(updateExperienceMonths) > 11)) {
      notifyError("Введите корректный стаж в месяцах (0-11)");
      return;
    }
    if (ageChanged && (Number(updateAge) <= 0 || Number(updateAge) > 150)) {
      notifyError("Введите корректный возраст (1-150)");
      return;
    }
    if (
      updatePassword === "" &&
      !roleChanged &&
      !nameChanged &&
      !professionChanged &&
      !yearsChanged &&
      !monthsChanged &&
      !genderChanged &&
      !ageChanged
    ) {
      notifyError("Нечего изменять: заполните хотя бы одно поле");
      return;
    }

    let updateInfo = {};
    if (updatePassword) {
      updateInfo.password = updatePassword;
    }
    if (roleChanged) {
      updateInfo.role = updateRole;
    }
    if (nameChanged) {
      updateInfo.name = updateName.trim();
    }
    if (professionChanged) {
      updateInfo.profession = updateProfession.trim();
    }
    if (yearsChanged) {
      updateInfo.experience_years = Number(updateExperienceYears);
    }
    if (monthsChanged) {
      updateInfo.experience_months = Number(updateExperienceMonths);
    }
    if (genderChanged) {
      updateInfo.gender = updateGender;
    }
    if (ageChanged) {
      updateInfo.age = Number(updateAge);
    }

    setUpdating(true);
    updateUser(id, updateInfo).then(
      (_) => {
        setUpdating(false);
        enqueueSnackbar("Пользователь обновлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        handleClose();
        setRefreshTick((tick) => tick + 1);
      },
      (e) => {
        setUpdating(false);
        const serverError = e.response?.data?.error;
        notifyError("Ошибка при обновлении пользователя" + (serverError ? `: ${serverError}` : ""));
      }
    );
  };

  const handleClickOpen = (user) => {
    setCurrentId(user.user_id);
    setEditUser(user);
    setUpdateRole(user.role);
    setUpdateName(user.name ?? "");
    setUpdateProfession(user.profession ?? "");
    setUpdateExperienceYears(user.experience_years != null ? String(user.experience_years) : "");
    setUpdateExperienceMonths(user.experience_months != null ? String(user.experience_months) : "0");
    setUpdateGender(user.gender ?? USER_GENDER_MALE);
    setUpdateAge(user.age != null ? String(user.age) : "");
    setOpen(true);
  };

  const handleClose = () => {
    setCurrentId(0);
    setEditUser(null);
    setUpdatePassword("");
    setUpdateRole(USER_ROLE_USER);
    setUpdateName("");
    setUpdateProfession("");
    setUpdateExperienceYears("");
    setUpdateExperienceMonths("");
    setUpdateGender(USER_GENDER_MALE);
    setUpdateAge("");
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack width={"100%"} direction="column" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              Пользователи
            </Typography>
            <Button variant="contained" sx={{ height: 40 }} onClick={handleCreateOpen}>
              Добавить пользователя
            </Button>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              select
              sx={{ minWidth: 140 }}
              label="Искать по"
              value={searchTag}
              onChange={(event) => setSearchTag(event.target.value)}
            >
              {SEARCH_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Поиск (имеет приоритет над фильтром группы)"
              variant="outlined"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Autocomplete
              sx={{ minWidth: 260 }}
              options={fetchedGroups}
              getOptionLabel={(group) => group.name}
              renderInput={(params) => <TextField {...params} label="Фильтр по группе" />}
              value={fetchedGroups.find((group) => group.name === selectedGroupName) || null}
              onChange={(_, newValue) => {
                const newSelectedGroupName = newValue ? newValue.name : "";
                setSelectedGroupName(newSelectedGroupName);
                setSearchParams({ group_name: newSelectedGroupName, page: 1, sort_by: sortBy, sort_dir: sortDir });
              }}
            />
          </Stack>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  {headCells.map((column) => (
                    <TableCell
                      key={column.id}
                      sortDirection={sortBy === column.id ? sortDir : false}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      <TableSortLabel
                        active={sortBy === column.id}
                        direction={sortBy === column.id ? sortDir : "asc"}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched && filteredData !== null ? (
                  filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        Пользователи не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
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
                        <TableCell>{user.profession ?? ""}</TableCell>
                        <TableCell>{`${user.experience_years ?? 0} л. ${user.experience_months ?? 0} мес.`}</TableCell>
                        <TableCell>{user.age ?? ""}</TableCell>
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
              page={parseInt(qPage) || 1}
              onChange={(event, value) => {
                setSearchParams({ group_name: qGroupName, page: value, sort_by: sortBy, sort_dir: sortDir });
              }}
              variant="outlined"
              shape="rounded"
            />
          ) : (
            <></>
          )}
        </Stack>
      </Box>

      <Dialog open={createOpen} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить пользователя</DialogTitle>
        <DialogContent>
          <Stack width={"100%"} direction="column" spacing={2} sx={{ pt: 1 }}>
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
              type="password"
              autoComplete="new-password"
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              value={password}
              id="password-field"
              label="Введите пароль пользователя"
              helperText={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
              required={true}
              variant="outlined"
            />
            <TextField
              select
              label="Роль"
              value={role}
              onChange={(event) => {
                const newRole = event.target.value;
                setRole(newRole);
              }}
              id="role-select"
              variant={"outlined"}
            >
              {roleNameArr.map((item) => (
                <MenuItem key={item[0]} value={item[0]}>
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
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>Отмена</Button>
          <Button variant="contained" disabled={adding} onClick={addUser}>
            {adding ? "Добавление..." : "Добавить пользователя"}
          </Button>
        </DialogActions>
      </Dialog>

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
              helperText={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
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
            <TextField
              onChange={(event) => {
                setUpdateName(event.target.value);
              }}
              value={updateName}
              id="update-name-field"
              label="ФИО"
              helperText="Пусто — без изменений"
              variant="outlined"
            />
            <TextField
              onChange={(event) => {
                setUpdateProfession(event.target.value);
              }}
              value={updateProfession}
              id="update-profession-field"
              label="Профессия"
              helperText="Пусто — без изменений"
              variant="outlined"
            />
            <TextField
              type="number"
              inputProps={{ min: 0 }}
              onChange={(event) => {
                setUpdateExperienceYears(event.target.value);
              }}
              value={updateExperienceYears}
              id="update-experience-years-field"
              label="Стаж (лет)"
              helperText="Пусто — без изменений"
              variant="outlined"
            />
            <TextField
              type="number"
              inputProps={{ min: 0, max: 11 }}
              onChange={(event) => {
                setUpdateExperienceMonths(event.target.value);
              }}
              value={updateExperienceMonths}
              id="update-experience-months-field"
              label="Стаж (месяцев, 0-11)"
              variant="outlined"
            />
            <TextField
              select
              value={updateGender}
              onChange={(event) => {
                setUpdateGender(event.target.value);
              }}
              id="update-gender-select"
              label="Пол"
              variant="outlined"
            >
              <MenuItem value={USER_GENDER_MALE}>{USER_GENDER_MALE}</MenuItem>
              <MenuItem value={USER_GENDER_FEMALE}>{USER_GENDER_FEMALE}</MenuItem>
            </TextField>
            <TextField
              type="number"
              inputProps={{ min: 1, max: 150 }}
              onChange={(event) => {
                setUpdateAge(event.target.value);
              }}
              value={updateAge}
              id="update-age-field"
              label="Возраст"
              helperText="Пусто — без изменений"
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={() => updateUserUi(currentId)} disabled={updating}>
            {updating ? "Изменение..." : "Изменить"}
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
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUser;
