import React, { useContext, useState } from "react";
import { Box, Button, Card, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTRATION_ROUTE,
  RESEARCHER_ROOM_ROUTE,
  USER_ROLE_RESEARCHER,
} from "../utils/constants";
import { getAllGroups, login, registration } from "../http/userAPI";
import { observer } from "mobx-react-lite";
import { Context } from "../index";
import { useSnackbar } from "notistack";

const Auth = observer(() => {
  const { user } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === LOGIN_ROUTE;
  const [userLogin, setUserLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [isOpenedGroupSelect, setIsOpenedGroupSelect] = useState(false);
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  const click = async () => {
    try {
      let data;
      if (isLogin) {
        data = await login(userLogin, password);
      } else {
        let groupId = null;
        if (selectedGroup !== "") {
          groupId = selectedGroup.id;
        }
        data = await registration(userLogin, password, name, groupId);
      }
      if (data !== undefined) {
        user.setUser(data);
        user.setIsAuth(true);

        if (data.role === USER_ROLE_RESEARCHER) {
          navigate(RESEARCHER_ROOM_ROUTE);
        } else {
          navigate(HOME_ROUTE);
        }
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
          <TextField
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            value={password}
            id="password-field"
            label="Введите ваш пароль"
            variant="outlined"
          />
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
