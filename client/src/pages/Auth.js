import React, { useContext, useState } from "react";
import { Box, Button, Card, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
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
  const [experienceYears, setExperienceYears] = useState("");
  const [gender, setGender] = useState(USER_GENDER_MALE);
  const [age, setAge] = useState("");

  const [isOpenedGroupSelect, setIsOpenedGroupSelect] = useState(false);
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const validateRegistration = () => {
    if (profession.trim() === "") {
      return "Введите профессию";
    }
    if (experienceYears === "" || Number(experienceYears) < 0) {
      return "Введите корректный стаж (в годах)";
    }
    if (age === "" || Number(age) <= 0 || Number(age) > 150) {
      return "Введите корректный возраст";
    }
    if (!USER_GENDER_OPTIONS.includes(gender)) {
      return "Выберите пол";
    }
    return null;
  };

  const click = async () => {
    try {
      let data;
      if (isLogin) {
        data = await login(userLogin, password);
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
        data = await registration(userLogin, password, name, {
          profession: profession.trim(),
          experienceYears: Number(experienceYears),
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
      enqueueSnackbar("Ошибка при авторизации или регистрации", {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
    }
  };

  const fetchGroups = () => {
    getAllGroups().then((data) => {
      setFetchedGroups(data);
    });
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card
        sx={{
          minWidth: "400px",
          maxWidth: "600px",
          width: "50%",
          padding: "36px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Stack width={"100%"} direction="column" spacing={4}>
          <Typography align={"center"} variant="h4" noWrap component="div">
            {isLogin ? "Авторизация" : "Регистрация"}
          </Typography>
          <TextField
            onChange={(event) => {
              setUserLogin(event.target.value);
            }}
            value={userLogin}
            id="login-field"
            label="Введите ваш логин"
            variant="outlined"
          />
          {isLogin ? (
            <></>
          ) : (
            <TextField
              onChange={(event) => {
                setName(event.target.value);
              }}
              value={name}
              id="name-field"
              label="Введите ФИО"
              variant="outlined"
            />
          )}
          {!isLogin ? (
            <>
              <TextField
                onChange={(event) => {
                  setProfession(event.target.value);
                }}
                value={profession}
                id="profession-field"
                label="Профессия"
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
                variant="outlined"
              />
            </>
          ) : (
            <></>
          )}
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
          {isLogin ? (
            <></>
          ) : (
            <>
              <FormControlLabel
                control={
                  <Switch
                    onChange={(event) => {
                      event.target.checked ? fetchGroups() : setSelectedGroup("");
                      setIsOpenedGroupSelect(event.target.checked);
                    }}
                  />
                }
                label="Состою в группе"
                id="group-switch"
              />
              {isOpenedGroupSelect ? (
                <>
                  <TextField
                    select
                    value={selectedGroup}
                    onChange={(event) => {
                      const newSelectedGroup = event.target.value;
                      setSelectedGroup(newSelectedGroup);
                    }}
                    id="group-select"
                    variant={"outlined"}
                    sx={{
                      flexGrow: 9,
                    }}
                  >
                    {fetchedGroups.map((item) => (
                      <MenuItem id={"groupItem" + item.id} value={item}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </>
              ) : (
                <></>
              )}
            </>
          )}
          <Stack alignItems={"center"} justifyContent={"space-between"} direction={"row"} spacing={4}>
            <Stack direction={"row"} align={"center"} alignItems={"center"}>
              {isLogin ? (
                <>
                  <Typography variant="h8" noWrap component="div">
                    Нет аккаунта?
                  </Typography>
                  <NavLink to={REGISTRATION_ROUTE}>Зарегистрируйтесь.</NavLink>
                </>
              ) : (
                <>
                  <Typography variant="h8" noWrap component="div">
                    Есть аккаунт?
                  </Typography>
                  <NavLink to={LOGIN_ROUTE}>Войдите.</NavLink>
                </>
              )}
            </Stack>
            <Button variant={"outlined"} onClick={click}>
              {isLogin ? "Войти" : "Зарегистрироваться"}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
});

export default Auth;
