import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ADMIN_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
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
import MenuNavIcon from "./icons/MenuNavIcon";

export default function NavBarDrawer() {
  const navigate = useNavigate();
  const { user, navBar } = useContext(Context);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        name: "Профиль",
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
      { name: "Начать игру", route: HOME_ROUTE, icon: <StartGameNavIcon /> },
      {
        name: "Профиль",
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
        name: "Профиль",
        route: USER_PROFILE_ROUTE,
        icon: <ProfileNavIcon />,
      },
    ];
  }

  const authItem = user.isAuth
    ? { name: "Выйти", icon: <LoginNavIcon />, action: logOut }
    : { name: "Войти", icon: <LoginNavIcon />, action: () => navigate(LOGIN_ROUTE) };

  const handleNavClick = (item) => {
    navBar.setSelectedPage(item.name);
    setDrawerOpen(false);
    navigate(item.route);
  };

  const renderItem = (item) => (
    <ListItem key={item.name} disablePadding>
      <ListItemButton
        selected={item.route !== undefined && navBar.selectedPage === item.name}
        onClick={() => (item.action ? item.action() : handleNavClick(item))}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.name} />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
          {isMobile && (
            <IconButton
              aria-label="Открыть меню"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuNavIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, userSelect: "none" }}>
            Удержи процесс!
          </Typography>
          {!isMobile && (
            <Box display="flex" direction="row" gap={1.25}>
              {navItems.map(renderItem)}
              {renderItem(authItem)}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280 }} role="presentation">
          <List>
            {navItems.map(renderItem)}
            {renderItem(authItem)}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
