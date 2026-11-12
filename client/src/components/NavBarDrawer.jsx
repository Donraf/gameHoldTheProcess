import {
  AppBar,
  Box,
  CssBaseline,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  ADMIN_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  RESEARCHER_GROUP_ROUTE,
  RESEARCHER_ROOM_ROUTE,
  USER_PROFILE_ROUTE,
  USER_ROLE_ADMIN,
  USER_ROLE_RESEARCHER,
  USER_ROLE_USER,
} from "../utils/constants";
import { Context } from "../index";
import ProfileNavIcon from "./icons/ProfileNavIcon";
import AdminNavIcon from "./icons/AdminNavIcon";
import StartGameNavIcon from "./icons/StartGameNavIcon";
import LoginNavIcon from "./icons/LoginNavIcon";

export default function NavBarDrawer() {
  const navigate = useNavigate();
  const { user, navBar } = useContext(Context);

  const logOut = () => {
    user.setUser({});
    user.setIsAuth(false);
    localStorage.removeItem("token");
    navigate(HOME_ROUTE);
  };

  let navItems = [];

  if (user.isAuth && user.user.role === USER_ROLE_USER) {
    navItems = navItems.concat([
      { name: "Начать игру", route: HOME_ROUTE, icon: <StartGameNavIcon /> },
      {
        name: "Настройки",
        route: USER_PROFILE_ROUTE,
        icon: <ProfileNavIcon />,
      },
    ]);
  }

  if (user.isAuth && user.user.role === USER_ROLE_ADMIN) {
    navItems = [
      {
        name: "Панель администратора",
        route: ADMIN_ROUTE,
        icon: <AdminNavIcon />,
      },
      {
        name: "Комната исследователя",
        route: RESEARCHER_ROOM_ROUTE + "?group_name=&page=1",
        icon: <AdminNavIcon />,
      },
      {
        name: "Работа с группами",
        route: RESEARCHER_GROUP_ROUTE,
        icon: <AdminNavIcon />,
      },
      { name: "Начать игру", route: HOME_ROUTE, icon: <StartGameNavIcon /> },
      {
        name: "Настройки",
        route: USER_PROFILE_ROUTE,
        icon: <ProfileNavIcon />,
      },
    ];
  }

  if (user.isAuth && user.user.role === USER_ROLE_RESEARCHER) {
    navItems = [
      {
        name: "Комната исследователя",
        route: RESEARCHER_ROOM_ROUTE + "?group_name=&page=1",
        icon: <AdminNavIcon />,
      },
      {
        name: "Работа с группами",
        route: RESEARCHER_GROUP_ROUTE,
        icon: <AdminNavIcon />,
      },
      {
        name: "Настройки",
        route: USER_PROFILE_ROUTE,
        icon: <ProfileNavIcon />,
      },
    ];
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, userSelect: "none" }}>
            Удержи процесс!
          </Typography>
          <Box display="flex" direction="row" gap="10px">
            {navItems.map((item) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  selected={navBar.selectedPage === item.name}
                  onClick={() => {
                    navBar.setSelectedPage(item.name);
                    navigate(item.route);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
            {user.isAuth ? (
              <ListItem key="Выйти" disablePadding>
                <ListItemButton
                  onClick={() => {
                    logOut();
                  }}
                >
                  <ListItemIcon>
                    <LoginNavIcon />
                  </ListItemIcon>
                  <ListItemText primary="Выйти" />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem key="Войти" disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(LOGIN_ROUTE);
                  }}
                >
                  <ListItemIcon>
                    <LoginNavIcon />
                  </ListItemIcon>
                  <ListItemText primary="Войти" />
                </ListItemButton>
              </ListItem>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
