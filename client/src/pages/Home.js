import React, {useContext, useEffect, useRef, useState} from 'react';
import { InteractionItem } from 'chart.js';
import {ChartData} from "../utils/ChartData";
import {
    AppBar,
    Box, Button,
    CssBaseline, Stack, TextField,
    Toolbar,
    Typography
} from "@mui/material";
import {
    Chart as ChartJS,
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
} from 'chart.js';
import {
    Chart,
    getDatasetAtEvent,
    getElementAtEvent,
    getElementsAtEvent,
} from 'react-chartjs-2';

import NavBarDrawer from "../components/NavBarDrawer";
import {Context} from "../index";
import {useNavigate} from "react-router-dom";
import {HOME_ROUTE, LOGIN_ROUTE} from "../utils/constants";
import {observer} from "mobx-react-lite";

ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip
);

export const options = {
    animations: {
      x: {
          duration: 1000,
      },
      y: {
          duration: 0,
      }
    },
    scales: {
        y: {
            beginAtZero: true,
            min: 0,
            max: 1
        },
    },
};

const Home = observer( () => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            chartData.generateNextSet();
            setUpdateTrigger(!updateTrigger);
            setTime(Date.now())
            },
            1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    const chartRef = useRef<ChartJS>(null);

    const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
        const { current: chart } = chartRef;
        if (!chart) {
            return;
        }
    };

    const {user} = useContext(Context);
    const navigate = useNavigate();
    const [chartData, setChartData] = useState(new ChartData());
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
        // setIsDataFetched(false);
    }, [updateTrigger])

    const filterData = () => {
        // if (filterInput) {
        //     setFilteredData(experiments.experiments.filter(data => data.mark.toLowerCase().includes(filterInput.toLowerCase())))
        // } else {
        //     setFilteredData(experiments.experiments)
        // }
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
                <Box sx={{width:'95%'}}>
                    <Chart
                        ref={chartRef}
                        options={options}
                        data={chartData.data}
                        type='line'/>
                </Box>
                <Stack direction="row" spacing={2} >
                    <Button sx={{color: "#FFFFFF", backgroundColor: "#9356A0"}} onClick={ () => {  } }>Press Me!</Button>
                    <Button sx={{color: "#FFFFFF", backgroundColor: "#9356A0"}} onClick={ () => {  } }>Press Me!</Button>
                    <Button sx={{color: "#FFFFFF", backgroundColor: "#9356A0"}} onClick={ () => {  } }>Press Me!</Button>
                    <Button sx={{color: "#FFFFFF", backgroundColor: "#9356A0"}} onClick={ () => {  } }>Пауза</Button>
                    <Button sx={{color: "#FFFFFF", backgroundColor: "#A05657"}} onClick={ () => {  } }>Остановить процесс</Button>
                </Stack>
            </Box>
        </Box>
    );
});

export default Home;