import React, {useContext, useEffect, useRef, useState} from 'react';
import {ChartData} from "../utils/ChartData";
import {
    AppBar,
    Box, Button, Container,
    CssBaseline, FormControlLabel, Paper, Slide, Stack, Switch,
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
} from 'react-chartjs-2';

import NavBarDrawer from "../components/NavBarDrawer";
import {Context} from "../index";
import {useNavigate} from "react-router-dom";
import {HOME_ROUTE, LOGIN_ROUTE} from "../utils/constants";
import {observer} from "mobx-react-lite";
import DecreaseSpeedIcon from "../components/icons/DecreaseSpeedIcon";
import IncreaseSpeedIcon from "../components/icons/IncreaseSpeedIcon";
import DangerIcon from "../components/icons/DangerIcon";
import {useSnackbar} from "notistack";
import {createGraph} from "../http/graphAPI";

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
    const chartRef = useRef<ChartJS>(null);
    const {user} = useContext(Context);
    const navigate = useNavigate();

    const [isSlidingIn, setIsSlidingIn] = React.useState(false);

    const containerRef = React.useRef(null);

    const speedOptions = [0.5, 1, 1.5, 2]

    const [time, setTime] = useState(Date.now());
    const [chartData, setChartData] = useState(new ChartData());
    const [isChartPaused, setIsChartPaused] = useState(true);
    const [isChartStopped, setIsChartStopped] = useState(false);
    const [curSpeed, setCurSpeed] = useState(speedOptions[1]);
    const [scoresChanges, setScoresChanges] = useState([]);

    const { enqueueSnackbar } = useSnackbar();

    const increaseSpeed = () => {
        const curIndex = speedOptions.findIndex( value => { return value === curSpeed })
        if (curIndex < speedOptions.length - 1) {
            setCurSpeed( speedOptions[curIndex + 1] )
        }
    }

    const decreaseSpeed = () => {
        const curIndex = speedOptions.findIndex( value => { return value === curSpeed })
        if (curIndex > 0) {
            setCurSpeed( speedOptions[curIndex - 1] )
        }
    }

    const logOut = () => {
        user.setUser({})
        user.setIsAuth(false)
        navigate(HOME_ROUTE)
    }

    useEffect(() => {
        if (!isChartPaused) {
            const interval = setInterval(() => {
                    chartData.generateNextSet();
                    setScoresChanges(["+10"])
                    setTime(Date.now())
                    if (chartData.isCrashed()) {
                        chartData.chartCrashed()
                        createGraph(chartData.points, user.user.user_id)
                        chartData.restart()
                        enqueueSnackbar("Критическое значение процесса превышено. Процесс перезапущен.", {variant: "error", autoHideDuration: 3000, preventDuplicate: true})
                    }
                    if (chartData.isDanger()) {
                        setIsChartPaused(true)
                    }
                },
                1000 / curSpeed);
            return () => {
                clearInterval(interval);
            };
        }
    }, [isChartPaused, curSpeed]);

    useEffect( () => {
        if (isChartStopped) {
            chartData.chartStopped()
            createGraph(chartData.points, user.user.user_id).then(r => {
                chartData.restart()
                setIsChartStopped(false);
                setIsChartPaused(false);
            })
        }
    }, [isChartStopped]);

    useEffect( () => {
        setInterval(() => {
                if (scoresChanges.length > 0) {
                    setScoresChanges([]);
                }
            },
            1500 / curSpeed);
    }, [scoresChanges]);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Начать игру
                    </Typography>
                    <Stack direction="row" spacing={2} >
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {user.user.login ? user.user.login : ""}
                        </Typography>
                        { user.isAuth
                            ? <Button sx={{color: "#FFFFFF", border: "white 1px solid"}} onClick={() => logOut()}>Выйти</Button>
                            : <Button sx={{color: "#FFFFFF", border: "white 1px solid"}} onClick={() => navigate(LOGIN_ROUTE)}>Войти</Button>
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
                <Box sx={{ p: 2, height: 100, overflow: 'hidden' }} ref={containerRef}>
                    {/*{*/}
                    {/*    scoresChanges.map( text =>*/}
                    {/*        <Slide in={true} container={containerRef.current}>*/}
                    {/*            <Typography variant="h6">{text}</Typography>*/}
                    {/*        </Slide>*/}
                    {/*    )*/}
                    {/*}*/}
                    <Typography variant="h6">Очки: {chartData.score}</Typography>
                </Box>
                <Container sx={{width:'95%'}}>
                    <Chart
                        ref={chartRef}
                        options={options}
                        data={chartData.data}
                        type='line'/>
                    {
                        (isChartPaused && chartData.data.labels.length === 0)
                            ? <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    width: "100%",
                                }}
                                onClick={ () => { setIsChartPaused(false) } }>
                                Начать игру!
                            </Button>
                            : <Stack display="flex" direction="row" spacing={1} >
                                <Box sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    display: "flex",
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    px: "8px",
                                    py: "12px",
                                    borderRadius: "4px",
                                }}
                                     onClick={ () => { decreaseSpeed() } }>
                                    <DecreaseSpeedIcon/>
                                </Box>
                                <Box
                                    sx={{
                                        // color: "#FFFFFF",
                                        // backgroundColor: "#9356A0",
                                        width: "60px",
                                        display: "flex",
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: "1px solid #000000",
                                        borderRadius: "4px",
                                    }}
                                >
                                    <Typography variant="h6">
                                        {"x" + curSpeed.toString()}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    display: "flex",
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    px: "8px",
                                    py: "12px",
                                    borderRadius: "4px",
                                }}
                                     onClick={ () => { increaseSpeed() } }>
                                    <IncreaseSpeedIcon/>
                                </Box>
                                { isChartPaused
                                    ? <Button
                                        sx={{
                                            color: "#FFFFFF",
                                            backgroundColor: "#9356A0",
                                            flexGrow: 1,
                                        }}
                                        disabled={chartData.isDanger()}
                                        onClick={ () => { setIsChartPaused(false) } }
                                    >Продолжить
                                    </Button>
                                    : <Button
                                        sx={{
                                            color: "#FFFFFF",
                                            backgroundColor: "#9356A0",
                                            flexGrow: 1,
                                        }}
                                        onClick={ () => { setIsChartPaused(true) } }>
                                        Пауза
                                    </Button>
                                }
                                <Button
                                    sx={{
                                        color: "#FFFFFF",
                                        backgroundColor: "#A05657",
                                        flexGrow: 1,
                                    }}
                                    disabled={chartData.isDanger()}
                                    onClick={ () => { setIsChartStopped(true) } }>
                                    Остановить процесс
                                </Button>
                            </Stack>
                    }
                </Container>
            </Box>
            { chartData.isDanger()
                ?
                <Box sx={{
                    position: 'fixed',
                    zIndex: 5500,
                    display: 'flex',
                    right: '16px',
                    bottom: '16px',
                    left: '16px',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '3px solid #A05657',
                    backgroundColor: '#FFFFFF',
                }} >
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} >
                            <DangerIcon/>
                            <Stack>
                                <Typography>Внимание!</Typography>
                                <Typography>Появилась опасность взрыва. Примите решение об остановке процесса.</Typography>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} >
                            <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    flexGrow: 1,
                                }}
                                onClick={ () => {  } }>
                                Показать подсказку
                            </Button>
                            <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    flexGrow: 1,
                                }}
                                onClick={ () => { setIsChartPaused(false) } }>
                                Продолжить процесс
                            </Button>
                            <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#A05657",
                                    flexGrow: 1,
                                }}
                                onClick={ () => { setIsChartStopped(true) } }>
                                Остановить процесс
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
                : <></>
            }
        </Box>
    );
});

export default Home;