import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  CssBaseline,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";

import NavBarDrawer from "../components/NavBarDrawer";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { fetchUser, updateProfile } from "../http/userAPI";
import { useSnackbar } from "notistack";
import { MIN_PASSWORD_LENGTH, USER_GENDER_OPTIONS } from "../utils/constants";

const emptyInfo = {
  name: "",
  profession: "",
  experienceYears: "",
  experienceMonths: "",
  gender: "",
  age: "",
};

function infoFromUser(userData) {
  return {
    name: userData.name ?? "",
    profession: userData.profession ?? "",
    experienceYears: userData.experience_years != null ? String(userData.experience_years) : "",
    experienceMonths: userData.experience_months != null ? String(userData.experience_months) : "",
    gender: userData.gender ?? "",
    age: userData.age != null ? String(userData.age) : "",
  };
}

const UserProfile = observer(() => {
  const { user } = useContext(Context);

  const [updatePassword, setUpdatePassword] = useState("");
  const [updateRepeatPassword, setUpdateRepeatPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [info, setInfo] = useState(emptyInfo);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const notifyError = (text) =>
    enqueueSnackbar(text, { variant: "error", autoHideDuration: 4000, preventDuplicate: true });
  const notifySuccess = (text) =>
    enqueueSnackbar(text, { variant: "success", autoHideDuration: 3000, preventDuplicate: true });

  useEffect(() => {
    if (!user.isAuth) {
      return;
    }
    fetchUser(user.user.user_id).then(
      (response) => {
        setInfo(infoFromUser(response.data ?? response));
        setInfoLoaded(true);
      },
      () => {
        notifyError("Ошибка при загрузке данных профиля");
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.isAuth]);

  const setInfoField = (key) => (event) => {
    setInfo((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const validateInfo = () => {
    if (info.name.trim() === "") {
      return "Введите ФИО";
    }
    if (info.profession.trim() === "") {
      return "Введите профессию";
    }
    const years = Number(info.experienceYears);
    if (info.experienceYears === "" || !Number.isInteger(years) || years < 0) {
      return "Стаж (лет) должен быть целым неотрицательным числом";
    }
    const months = Number(info.experienceMonths);
    if (info.experienceMonths === "" || !Number.isInteger(months) || months < 0 || months > 11) {
      return "Стаж (месяцев) должен быть целым числом от 0 до 11";
    }
    if (!USER_GENDER_OPTIONS.includes(info.gender)) {
      return "Выберите пол";
    }
    const age = Number(info.age);
    if (info.age === "" || !Number.isInteger(age) || age <= 0 || age > 150) {
      return "Возраст должен быть целым числом от 1 до 150";
    }
    return null;
  };

  const saveInfo = () => {
    const validationError = validateInfo();
    if (validationError) {
      notifyError(validationError);
      return;
    }
    if (infoSaving) {
      return;
    }

    setInfoSaving(true);
    updateProfile({
      name: info.name.trim(),
      profession: info.profession.trim(),
      experience_years: Number(info.experienceYears),
      experience_months: Number(info.experienceMonths),
      gender: info.gender,
      age: Number(info.age),
    }).then(
      () => {
        setInfoSaving(false);
        notifySuccess("Данные профиля обновлены");
      },
      () => {
        setInfoSaving(false);
        notifyError("Ошибка при обновлении данных профиля");
      }
    );
  };

  const updateUserUi = () => {
    if (updatePassword === "") {
      notifyError("Введите новый пароль");
      return;
    }
    if (updatePassword.length < MIN_PASSWORD_LENGTH) {
      notifyError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (updatePassword !== updateRepeatPassword) {
      notifyError("Введенные пароли не совпадают");
      return;
    }
    if (passwordSaving) {
      return;
    }

    setPasswordSaving(true);
    updateProfile({ password: updatePassword }).then(
      () => {
        setPasswordSaving(false);
        notifySuccess("Пароль обновлен");
        setUpdatePassword("");
        setUpdateRepeatPassword("");
      },
      () => {
        setPasswordSaving(false);
        notifyError("Ошибка при обновлении пароля");
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
          <Stack maxWidth={480} direction="column" spacing={3}>
            <Stack direction="column" spacing={2}>
              <Typography variant="h4" component="div">
                Личная информация
              </Typography>
              <TextField
                label="Логин"
                variant="outlined"
                value={user.user.login ?? ""}
                disabled
                helperText="Логин изменить нельзя"
              />
              <TextField
                label="ФИО"
                variant="outlined"
                value={info.name}
                onChange={setInfoField("name")}
                disabled={!infoLoaded}
              />
              <TextField
                label="Профессия"
                variant="outlined"
                value={info.profession}
                onChange={setInfoField("profession")}
                disabled={!infoLoaded}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Стаж (лет)"
                  variant="outlined"
                  value={info.experienceYears}
                  onChange={setInfoField("experienceYears")}
                  disabled={!infoLoaded}
                />
                <TextField
                  fullWidth
                  label="Стаж (месяцев)"
                  variant="outlined"
                  value={info.experienceMonths}
                  onChange={setInfoField("experienceMonths")}
                  disabled={!infoLoaded}
                  helperText="От 0 до 11"
                />
              </Stack>
              <TextField
                select
                label="Пол"
                variant="outlined"
                value={info.gender}
                onChange={setInfoField("gender")}
                disabled={!infoLoaded}
              >
                {USER_GENDER_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Возраст"
                variant="outlined"
                value={info.age}
                onChange={setInfoField("age")}
                disabled={!infoLoaded}
              />
              <Button
                sx={{ width: "fit-content", height: "40px" }}
                variant="contained"
                disabled={!infoLoaded || infoSaving}
                onClick={saveInfo}
              >
                {infoSaving ? "Сохранение..." : "Сохранить данные"}
              </Button>
            </Stack>

            <Divider />

            <Stack direction="column" spacing={2}>
              <Typography variant="h4" component="div">
                Изменение пароля
              </Typography>
              <TextField
                type="password"
                autoComplete="new-password"
                onChange={(event) => {
                  setUpdatePassword(event.target.value);
                }}
                value={updatePassword}
                label="Введите новый пароль"
                variant="outlined"
                helperText={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
              />
              <TextField
                type="password"
                autoComplete="new-password"
                onChange={(event) => {
                  setUpdateRepeatPassword(event.target.value);
                }}
                value={updateRepeatPassword}
                label="Повторите новый пароль"
                variant="outlined"
              />
              <Button
                sx={{ width: "fit-content", height: "40px" }}
                variant="contained"
                disabled={passwordSaving}
                onClick={updateUserUi}
              >
                {passwordSaving ? "Сохранение..." : "Обновить пароль"}
              </Button>
            </Stack>
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
