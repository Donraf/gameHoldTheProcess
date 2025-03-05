import React, {useContext} from 'react';
import {observer} from "mobx-react-lite";
import {Context} from "../index";
import {useNavigate} from "react-router-dom";
import {
    AppBar,
    Box,
    Button,
    CssBaseline,
    Stack,
    Toolbar,
    Typography
} from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import {
    ADMIN_GRAPH_ROUTE,
    ADMIN_USER_ROUTE,
    HOME_ROUTE,
    LOGIN_ROUTE
} from "../utils/constants";
import Grid from "@mui/material/Grid2";

const Admin = observer( () => {
    const {user} = useContext(Context);
    const navigate = useNavigate();

    const logOut = () => {
        user.setUser({})
        user.setIsAuth(false)
        navigate(HOME_ROUTE)
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Панель администратора
                    </Typography>
                    <Stack direction="row" spacing={2} >
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {user.user.name ? user.user.name : ""}
                        </Typography>
                        { user.isAuth ?
                            <Button sx={{color: "#FFFFFF", border: "white 1px solid"}} onClick={() => logOut()}>Выйти</Button>
                            :
                            <Button sx={{color: "#FFFFFF", border: "white 1px solid"}} onClick={() => navigate(LOGIN_ROUTE)}>Войти</Button>
                        }
                    </Stack>
                </Toolbar>
            </AppBar>
            <NavBarDrawer/>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar />

                <Stack width={'100%'} direction="column" spacing={1}>
                    <Typography variant="h4" component="div">
                        Изменение объектов
                    </Typography>

                    <Box sx={{ flexGrow: 1 }}>
                        <Grid container spacing={2}>
                            <Grid size={4}>
                                <Button sx={{width:"100%", height: "64px"}} variant="contained"
                                        onClick={() => { navigate(ADMIN_USER_ROUTE) }}>
                                    Изменить пользователя
                                </Button>
                            </Grid>
                            <Grid size={4}>
                                <Button sx={{width:"100%", height: "64px"}} variant="contained"
                                        onClick={() => { navigate(ADMIN_GRAPH_ROUTE) }}>
                                    Изменить пройденную игру
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
});

export default Admin;
