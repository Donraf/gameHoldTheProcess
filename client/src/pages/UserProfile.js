import React, {useContext, useEffect, useState} from 'react';
import {
    AppBar,
    Box, Button,
    CssBaseline, Stack, TextField,
    Toolbar,
    Typography
} from "@mui/material";

import NavBarDrawer from "../components/NavBarDrawer";
import {Context} from "../index";
import {useNavigate} from "react-router-dom";
import {HOME_ROUTE, LOGIN_ROUTE} from "../utils/constants";
import {observer} from "mobx-react-lite";
import {updateUser} from "../http/userAPI";
import {useSnackbar} from "notistack";

const UserProfile = observer( () => {
    const {user} = useContext(Context);
    const navigate = useNavigate();

    const [updatePassword, setUpdatePassword] = useState('')
    const [updateRepeatPassword, setUpdateRepeatPassword] = useState('')

    const [updateTrigger, setUpdateTrigger] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [filterInput, setFilterInput] = useState("");
    const [filteredData, setFilteredData] = useState(null)

    const [snackErrTexts, setSnackErrTexts] = React.useState([]);
    const { enqueueSnackbar } = useSnackbar();

    const logOut = () => {
        user.setUser({})
        user.setIsAuth(false)
        navigate(HOME_ROUTE)
    }

    useEffect(() => {
        if (user.user.user_id){
            setIsDataFetched(false);
            filterData(user.user.user_id).then( () => {setIsDataFetched(true)} )
        } else {
            setIsDataFetched(true);
        }
    }, [updateTrigger])

    useEffect(() => {
        snackErrTexts.map(text => enqueueSnackbar(text, {variant: "error", autoHideDuration: 3000, preventDuplicate: true}))
    },[snackErrTexts])

    const filterData = async (user_id) => {  }

    const updateUserUi = () => {
        let snackErrors = []
        if (updatePassword === "") {
            snackErrors.push("Введите новый пароль")
        } else if (updatePassword !== updateRepeatPassword) {
            snackErrors.push("Введенные пароли не совпадают")
        }
        if (snackErrors.length !== 0){
            setSnackErrTexts(snackErrors)
            return
        }

        let updateInfo = {}
        updateInfo.password = updatePassword;
        updateUser(user.user.user_id, updateInfo).then(
            _ => {
                enqueueSnackbar("Пароль обновлен", {variant: "success", autoHideDuration: 3000, preventDuplicate: true})
                setUpdatePassword('');
                setUpdateRepeatPassword('');
                setUpdateTrigger(!updateTrigger);
            },
            _ => {
                enqueueSnackbar("Ошибка при обновлении пароля", {variant: "error", autoHideDuration: 3000, preventDuplicate: true})
            }
        )
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Профиль
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
            {
                user.isAuth ?
                    <Box
                        component="main"
                        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
                    >
                        <Toolbar />
                        <Stack width={'100%'} direction="column" spacing={1}>

                            <Typography variant="h4" component="div">
                                Изменение пароля
                            </Typography>
                            <TextField onChange={ event => {setUpdatePassword(event.target.value)}}
                                       value={updatePassword}
                                       id="outlined-basic"
                                       label="Введите новый пароль"
                                       variant="outlined"/>
                            <TextField onChange={ event => {setUpdateRepeatPassword(event.target.value)}}
                                       value={updateRepeatPassword}
                                       id="outlined-basic"
                                       label="Повторите новый пароль"
                                       variant="outlined"/>
                            <Button sx={{width:"fit-content", height: "40px"}} variant="contained"
                                    onClick={() => {updateUserUi()}}>
                                Обновить пароль
                            </Button>

                            <Typography variant="h4" component="div">
                                Моя статистика
                            </Typography>

                            <Stack width={'100%'} direction="row" spacing={1}>
                                <TextField fullWidth onChange={ event => {
                                    setFilterInput(event.target.value);
                                    setUpdateTrigger(!updateTrigger);
                                }}
                                           value={filterInput}
                                           id="outlined-basic"
                                           label="Введите идентификатор игры"
                                           variant="outlined"/>
                            </Stack>

                            {/*{isDataFetched && <ExperimentsGrid experiments={filteredData}/>}*/}

                        </Stack>
                    </Box>
                    :
                    <Box
                        component="main"
                        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
                    >
                        <Toolbar />
                        <Typography variant="h4" component="div">
                            Зарегистрируйтесь, чтобы посмотреть свой профиль.
                        </Typography>
                    </Box>
            }

        </Box>
    );
});

export default UserProfile;