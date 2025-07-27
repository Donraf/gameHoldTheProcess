import {
    AppBar,
    Box, Button, CssBaseline,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography
} from "@mui/material";
import React, {useContext} from "react";
import {useNavigate} from "react-router-dom";
import {ADMIN_ROUTE, HOME_ROUTE, LOGIN_ROUTE, USER_PROFILE_ROUTE, USER_ROLE_ADMIN} from "../utils/constants";
import {Context} from "../index";
import ProfileNavIcon from "./icons/ProfileNavIcon";
import AdminNavIcon from "./icons/AdminNavIcon";
import StartGameNavIcon from "./icons/StartGameNavIcon";

export default function NavBarDrawer() {

    const navigate = useNavigate()
    const {user, navBar} = useContext(Context);

    const logOut = () => {
        user.setUser({})
        user.setIsAuth(false)
        localStorage.removeItem('token')
        navigate(HOME_ROUTE)
    }

    let navItems = [
        {name: 'Начать игру', route: HOME_ROUTE, icon: <StartGameNavIcon/>},
        {name: 'Настройки', route: USER_PROFILE_ROUTE, icon: <ProfileNavIcon/>},
    ]

    if (user.user !== undefined && user.user.role === USER_ROLE_ADMIN) {
        navItems = [{name: 'Панель администратора', route: ADMIN_ROUTE, icon: <AdminNavIcon/>}].concat(navItems)
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar component="nav">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Удержи процесс!
                    </Typography>
                    <Box
                        display="flex"
                        direction="row"
                    >
                        {navItems.map(item =>
                            <ListItem key={item.name} disablePadding>
                                <ListItemButton selected={navBar.selectedPage === item.name} onClick={ () => {
                                    navBar.setSelectedPage(item.name)
                                    navigate(item.route)
                                } }>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.name} />
                                </ListItemButton>
                            </ListItem>
                        )}
                        { user.isAuth
                            ? <Button sx={{color: "#FFFFFF", border: "white 1px solid"}} onClick={() => logOut()}>Выйти</Button>
                            : <Button sx={{color: "#FFFFFF", border: "white 1px solid"}} onClick={() => navigate(LOGIN_ROUTE)}>Войти</Button>
                        }
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
