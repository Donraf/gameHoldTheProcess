import React, {useContext, useEffect, useState} from 'react';
import {
    AppBar,
    Box, Button,
    CssBaseline, Stack, TextField,
    Toolbar,
    Typography
} from "@mui/material";

import NavBarDrawer from "../components/NavBarDrawer";
import ExperimentsGrid from "../components/ExperimentsGrid";
import {Context} from "../index";
import {useNavigate} from "react-router-dom";
import {HOME_ROUTE, LOGIN_ROUTE, USER_ADD_EXPERIMENT_ROUTE} from "../utils/constants";
import {observer} from "mobx-react-lite";
import {fetchExperiments} from "../http/experimentsAPI";

const Home = observer( () => {
    const {user, experiments} = useContext(Context);
    const navigate = useNavigate();

    const [updateTrigger, setUpdateTrigger] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [filterInput, setFilterInput] = useState("");
    const [filteredData, setFilteredData] = useState(null)

    const logOut = () => {
        user.setUser({})
        user.setIsAuth(false)
        navigate(HOME_ROUTE)
    }

    useEffect(() => {
        setIsDataFetched(false);
        fetchExperiments().then(data => {
                experiments.setExperiments(data);
                filterData();
                setIsDataFetched(true);
            }
        )
    }, [updateTrigger])

    const filterData = () => {
        if (filterInput) {
            setFilteredData(experiments.experiments.filter(data => data.mark.toLowerCase().includes(filterInput.toLowerCase())))
        } else {
            setFilteredData(experiments.experiments)
        }
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Исследования
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
                <Stack width={'100%'} direction="row" spacing={1}>
                    <TextField fullWidth onChange={ event => {
                        setFilterInput(event.target.value);
                        setUpdateTrigger(!updateTrigger);
                    }}
                               value={filterInput}
                               id="outlined-basic"
                               label="Введите маркировку исследования"
                               variant="outlined"/>

                    <Button onClick={() => navigate(USER_ADD_EXPERIMENT_ROUTE)} variant="contained">Добавить исследование</Button>

                </Stack>

                {isDataFetched && <ExperimentsGrid experiments={filteredData}/>}
            </Box>
        </Box>
    );
});

export default Home;