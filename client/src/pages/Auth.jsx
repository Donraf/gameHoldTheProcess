import React, { useContext, useEffect, useState } from "react";
import { Autocomplete, Box, Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ADMIN_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  ONBOARDING_TESTS_ROUTE,
  REGISTRATION_ROUTE,
  RESEARCHER_ROOM_ROUTE,
  USER_GENDER_FEMALE,
  USER_GENDER_MALE,
  USER_GENDER_OPTIONS,
  MIN_PASSWORD_LENGTH,
} from "../utils/constants";
import { getAllGroups, login, registration } from "../http/userAPI";
import { resolvePostAuthRoute } from "../http/testAPI";
import { observer } from "mobx-react-lite";
import { Context } from "../index";
import { useSnackbar } from "notistack";
import ImageButton from "../components/ImageButton/ImageButton";
import OpenedEyeIcon from "../components/icons/OpenedEyeIcon";
import ClosedEyeIcon from "../components/icons/ClosedEyeIcon";

const Auth = observer(() => {
  const { user } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === LOGIN_ROUTE;
  const [userLogin, setUserLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [experienceMonths, setExperienceMonths] = useState("0");
  const [gender, setGender] = useState(USER_GENDER_MALE);
  const [age, setAge] = useState("");

  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  // Список групп нужен только на форме регистрации.
  useEffect(() => {
    if (!isLogin) {
      getAllGroups().then((data) => {
        setFetchedGroups(data);
      });
    }
  }, [isLogin]);

  const validateRegistration = () => {
    if (userLogin.trim() === "") {
      return "Введите логин";
    }
    if (name.trim() === "") {
      return "Введите ФИО";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
    }
    if (profession.trim() === "") {
      return "Введите профессию";
    }
    if (experienceYears === "" || Number(experienceYears) < 0) {
      return "Введите корректный стаж (в годах)";
    }
    if (experienceMonths === "" || Number(experienceMonths) < 0 || Number(experienceMonths) > 11) {
      return "Введите корректный стаж (в месяцах, от 0 до 11)";
    }
    if (age === "" || Number(age) <= 0 || Number(age) > 150) {
      return "Введите корректный возраст";
    }
    if (!USER_GENDER_OPTIONS.includes(gender)) {
      return "Выберите пол";
    }
    if (selectedGroup === "") {
      return "Выберите группу";
    }
    return null;
  };

  const click = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      let data;
      if (isLogin) {
        if (userLogin.trim() === "" || password === "") {
          enqueueSnackbar("Введите логин и пароль", {
            variant: "error",
            autoHideDuration: 3000,
            preventDuplicate: true,
          });
          return;
        }
        data = await login(userLogin.trim(), password);
      } else {
        const validationError = validateRegistration();
        if (validationError) {
          enqueueSnackbar(validationError, {
            variant: "error",
            autoHideDuration: 3000,
            preventDuplicate: true,
          });
          return;
        }

        let groupId = null;
        if (selectedGroup !== "") {
          groupId = selectedGroup.id;
        }
        data = await registration(userLogin.trim(), password, name.trim(), {
          profession: profession.trim(),
          experienceYears: Number(experienceYears),
          experienceMonths: Number(experienceMonths),
          gender,
          age: Number(age),
        }, groupId);
      }
      if (data !== undefined) {
        user.setUser(data);
        user.setIsAuth(true);

        const nextRoute = await resolvePostAuthRoute(
          data.role,
          HOME_ROUTE,
          RESEARCHER_ROOM_ROUTE,
          ONBOARDING_TESTS_ROUTE,
          ADMIN_ROUTE
        );
        navigate(nextRoute);
      }
    } catch (e) {
      const serverError = e.response?.data?.error;
      enqueueSnackbar(
        isLogin
          ? serverError === "invalid login or password"
            ? "Неверный логин или пароль"
            : "Ошибка при авторизации" + (serverError ? `: ${serverError}` : "")
          : "Ошибка при регистрации" + (serverError ? `: ${serverError}` : ""),
        {
          variant: "error",
          autoHideDuration: 4000,
          preventDuplicate: true,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card
        sx={{
          width: "100%",
          maxWidth: 480,
          mx: 2,
          p: { xs: 3, sm: 4.5 },
          display: "flex",
          alignItems: "center",
        }}
      >
        <Stack
          width={"100%"}
          direction="column"
          spacing={4}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            click();
          }}
        >
          <Typography align={"center"} variant="h4" component="h1">
            {isLogin ? "Авторизация" : "Регистрация"}
          </Typography>
          {!isLogin && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: -2 }}>
              Учётные данные
            </Typography>
          )}
          <TextField
            onChange={(event) => {
              setUserLogin(event.target.value);
            }}
            value={userLogin}
            id="login-field"
            label="Введите ваш логин"
            variant="outlined"
          />
          <Stack display="flex" direction="row" spacing={2}>
            <TextField
              sx={{
                flexGrow: 1,
              }}
              type={showPassword ? "text" : "password"}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              value={password}
              id="password-field"
              label="Введите ваш пароль"
              variant="outlined"
            />
            {showPassword ? (
              <>
                <ImageButton
                  onClick={() => {
                    setShowPassword(false);
                  }}
                >
                  <OpenedEyeIcon />
                </ImageButton>
              </>
            ) : (
              <>
                <ImageButton
                  onClick={() => {
                    setShowPassword(true);
                  }}
                >
                  <ClosedEyeIcon />
                </ImageButton>
              </>
            )}
          </Stack>
          {!isLogin ? (
            <>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: -2 }}>
                О себе
              </Typography>
              <TextField
                onChange={(event) => {
                  setName(event.target.value);
                }}
                value={name}
                id="name-field"
                label="Введите ФИО"
                variant="outlined"
              />
              <TextField
                onChange={(event) => {
                  setProfession(event.target.value);
                }}
                value={profession}
                id="profession-field"
                label="Профессия"
                variant="outlined"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 0 }}
                  onChange={(event) => {
                    setExperienceYears(event.target.value);
                  }}
                  value={experienceYears}
                  id="experience-field"
                  label="Стаж (лет)"
                  helperText="Можно указать 0 — без стажа"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: 11 }}
                  onChange={(event) => {
                    setExperienceMonths(event.target.value);
                  }}
                  value={experienceMonths}
                  id="experience-months-field"
                  label="Стаж (месяцев, 0-11)"
                  variant="outlined"
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  select
                  value={gender}
                  onChange={(event) => {
                    setGender(event.target.value);
                  }}
                  id="gender-select"
                  label="Пол"
                  variant="outlined"
                >
                  <MenuItem value={USER_GENDER_MALE}>{USER_GENDER_MALE}</MenuItem>
                  <MenuItem value={USER_GENDER_FEMALE}>{USER_GENDER_FEMALE}</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 1, max: 150 }}
                  onChange={(event) => {
                    setAge(event.target.value);
                  }}
                  value={age}
                  id="age-field"
                  label="Возраст"
                  variant="outlined"
                />
              </Stack>
              <Autocomplete
                options={fetchedGroups}
                getOptionLabel={(group) => group.name}
                renderInput={(params) => (
                  <TextField {...params} label="Выберите группу" required />
                )}
                value={selectedGroup || null}
                onChange={(_, newValue) => {
                  setSelectedGroup(newValue ?? "");
                }}
                noOptionsText="Группы не найдены"
                id="group-select"
              />
            </>
          ) : (
            <></>
          )}
          <Stack
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent={"space-between"}
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <Stack direction={"row"} align={"center"} alignItems={"center"} spacing={1}>
              {isLogin ? (
                <>
                  <Typography variant="body1" component="div">
                    Нет аккаунта?
                  </Typography>
                  <NavLink to={REGISTRATION_ROUTE}>Зарегистрируйтесь.</NavLink>
                </>
              ) : (
                <>
                  <Typography variant="body1" component="div">
                    Есть аккаунт?
                  </Typography>
                  <NavLink to={LOGIN_ROUTE}>Войдите.</NavLink>
                </>
              )}
            </Stack>
            <Button type="submit" variant={"contained"} disabled={submitting}>
              {submitting ? "Отправка..." : isLogin ? "Войти" : "Зарегистрироваться"}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
});

export default Auth;
