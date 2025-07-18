import React, {useContext, useEffect, useRef, useState} from 'react';
import {
    AppBar,
    Box, Button, Container,
    CssBaseline, Modal, Stack,
    Toolbar,
    Typography
} from "@mui/material";
import {
    Chart as ChartJS,
    LineController,
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
import {createGraph, fetchGraphs, getGraphsCount, getGraphsPageCount} from "../http/graphAPI";
import {ModalContent} from "../components/ModalContent";
import {fetchPointsByChartId} from "../http/pointAPI";
import {ChartData} from "../utils/ChartData";
import {transformToUiDateDayTime} from "../utils/transformDate";

ChartJS.register(
    LineController,
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip
);

async function chartToHintCharts(charts) {
    let hintCharts = []
    for (let i in charts) {
        let points = await fetchPointsByChartId(charts[i].id)
        let hintChart = {
            id: charts[i].id,
            createdAt: charts[i].createdAt,
            points: points
        }
        hintCharts.push(hintChart)
    }
    return hintCharts
}

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
    plugins: {
        legend: {
            onClick: () => {}
        }
    },
};

const Home = observer( () => {
    const chartRef = useRef<ChartJS>(null);
    const fullChartRef = useRef<ChartJS>(null);
    const {user, chart} = useContext(Context);
    const navigate = useNavigate();

    const [isSlidingIn, setIsSlidingIn] = React.useState(false);

    const [isRuleModalOpened, setIsRuleModalOpened] = React.useState(false);
    const handleOpenRuleModal = () => setIsRuleModalOpened(true);
    const handleCloseRuleModal = () => setIsRuleModalOpened(false);

    const [isHintModalOpened, setIsHintModalOpened] = React.useState(false);
    const handleOpenHintModal = () => setIsHintModalOpened(true);
    const handleCloseHintModal = () => {
        setIsHintModalOpened(false);
        setChosenHint("");
    };
    const [chosenHint, setChosenHint] = React.useState("");
    const [hintCharts, setHintCharts] = React.useState([]);
    const [countHintCharts, setCountHintCharts] = React.useState(0);
    const [curHintChartNum, setCurHintChartNum] = React.useState(1);
    const [countPageHintCharts, setCountPageHintCharts] = React.useState(0);
    const [curPageHintChartsNum, setCurPageHintChartsNum] = React.useState(1);
    const [curLocalHintChartNum, setCurLocalHintChartNum] = React.useState(1);
    const [hintModalDataFetched, setHintModalDataFetched] = React.useState(false);

    const containerRef = React.useRef(null);

    const speedOptions = [0.5, 1, 1.5, 2]

    const [time, setTime] = useState(Date.now());
    const [isChartPaused, setIsChartPaused] = useState(true);
    const [isChartStopped, setIsChartStopped] = useState(false);
    const [isDanger, setIsDanger] = useState(false);
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
        localStorage.removeItem('token')
        navigate(HOME_ROUTE)
    }

    useEffect(() => {
        if (!isChartPaused) {
            const interval = setInterval(() => {
                    chart.chartData.generateNextPoint();
                    setScoresChanges(["+10"])
                    setTime(Date.now())
                    if (chart.chartData.isCrashed()) {
                        chart.chartData.chartCrashed()
                        createGraph(chart.chartData.points, user.user.user_id)
                        chart.chartData.restart()
                        setIsHintModalOpened(false)
                        enqueueSnackbar("Критическое значение процесса превышено. Процесс перезапущен.", {variant: "error", autoHideDuration: 5000, preventDuplicate: true})
                    }
                    if (!isDanger && chart.chartData.isDanger()) {
                        setIsChartPaused(true)
                        setIsDanger(true)
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
            const isStopNeeded = chart.chartData.chartStopped()
            createGraph(chart.chartData.points, user.user.user_id)
            chart.chartData.restart()
            setIsHintModalOpened(false)
            setIsChartStopped(false);
            setIsChartPaused(false);
            if (!isStopNeeded) {
                enqueueSnackbar("Остановка процесса не была необходима. Часть баллов потеряна.", {variant: "error", autoHideDuration: 5000, preventDuplicate: true})
            } else {
                enqueueSnackbar("Остановка процесса была верным решением. Получено вознаграждение!", {variant: "success", autoHideDuration: 5000, preventDuplicate: true})
            }
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

    useEffect(() => {
        if (chosenHint === "AllSessions") {
            setHintModalDataFetched(false)
            const fetchData = async () => {
                let chartCount = await getGraphsCount("user_id", user.user.user_id)
                setCountHintCharts(chartCount)
                let pageCount = await getGraphsPageCount("user_id", user.user.user_id)
                setCountPageHintCharts(pageCount)
                let charts = await fetchGraphs("user_id", user.user.user_id, pageCount)
                let hintCharts = await chartToHintCharts(charts)
                setHintCharts(hintCharts)
                setCurLocalHintChartNum(charts.length - 1)
                setCurPageHintChartsNum(pageCount)
                setCurHintChartNum(1)
            }
            fetchData().then( () => {setHintModalDataFetched(true)} )
        }
    }, [chosenHint]);

    const moveToNextHintChart = async () => {
        if (curHintChartNum >= countHintCharts) return
        setCurHintChartNum(curHintChartNum + 1)
        if (curLocalHintChartNum <= 0 && curPageHintChartsNum > 1) {
            setHintModalDataFetched(false)
            let charts = await fetchGraphs("user_id", user.user.user_id, curPageHintChartsNum - 1)
            let hintCharts = await chartToHintCharts(charts)
            setHintCharts(hintCharts)
            setCurPageHintChartsNum(curPageHintChartsNum - 1)
            setCurLocalHintChartNum(charts.length - 1)
            setHintModalDataFetched(true)
            return
        }
        setCurLocalHintChartNum(curLocalHintChartNum - 1)
    }

    const moveToPrevHintChart = async () => {
        if (curHintChartNum <= 1) return
        setCurHintChartNum(curHintChartNum - 1)
        if (curLocalHintChartNum >= hintCharts.length - 1 && curPageHintChartsNum < countPageHintCharts) {
            setHintModalDataFetched(false)
            let charts = await fetchGraphs("user_id", user.user.user_id, curPageHintChartsNum + 1)
            let hintCharts = await chartToHintCharts(charts)
            setHintCharts(hintCharts)
            setCurPageHintChartsNum(curPageHintChartsNum + 1)
            setCurLocalHintChartNum(0)
            setHintModalDataFetched(true)
            return
        }
        setCurLocalHintChartNum(curLocalHintChartNum + 1)
    }

    const renderHintModal = (chosenVariant) => {
        switch (chosenVariant) {
            case "CurrentSession":
                return <>
                    <Typography>
                        Вся текущая сессия
                    </Typography>
                    <Chart
                        ref={fullChartRef}
                        options={options}
                        data={chart.chartData.fullData}
                    />
                    <Button
                        sx={{
                            color: "#FFFFFF",
                            backgroundColor: "#9356A0",
                            flexGrow: 1,
                        }}
                        onClick={ () => { setChosenHint("") } }>
                        Назад
                    </Button>
                </>
            case "AllSessions":
                let chartData = new ChartData()
                if (hintModalDataFetched && hintCharts.length > 0) {
                    chartData.restoreFromPoints(hintCharts[curLocalHintChartNum].points)
                }
                return <>
                {
                    hintModalDataFetched && hintCharts.length > 0
                        ? <>
                            <Typography>
                                Все предыдущие сессии
                            </Typography>
                            <Typography>
                                Игровая сессия {transformToUiDateDayTime(hintCharts[curLocalHintChartNum].createdAt)}
                            </Typography>
                            <Chart
                                ref={fullChartRef}
                                options={options}
                                data={chartData.data}
                            />
                        </>
                        :<>
                            {hintCharts.length <= 0
                                ?
                                <Typography>
                                    Предыдущих сессий нет
                                </Typography>
                                : <></>}
                        </>
                }
                    <Stack display="flex" direction="row" spacing={1} >
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
                             onClick={ () => { moveToPrevHintChart() }
                        }>
                            <DecreaseSpeedIcon/>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: "1px solid #000000",
                                borderRadius: "4px",
                            }}
                        >
                            <Typography variant="h6">
                                {curHintChartNum + "/" + countHintCharts}
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
                             onClick={ () => { moveToNextHintChart() }}>
                            <IncreaseSpeedIcon/>
                        </Box>
                        <Button
                            sx={{
                                color: "#FFFFFF",
                                backgroundColor: "#9356A0",
                                flexGrow: 1,
                            }}
                            onClick={ () => { setChosenHint("") } }>
                            Назад
                        </Button>
                    </Stack>
                </>
            default:
                return <>
                    <Typography>
                        Какую подсказку хотите купить?
                    </Typography>
                    <Button
                        sx={{
                            color: "#FFFFFF",
                            backgroundColor: "#9356A0",
                            flexGrow: 1,
                        }}
                        onClick={ () => {
                            setChosenHint("CurrentSession")
                            chart.chartData.chartHintUsed(200)
                        } }>
                        Показать всю текущую сессию (200 очков)
                    </Button>
                    <Button
                        sx={{
                            color: "#FFFFFF",
                            backgroundColor: "#9356A0",
                            flexGrow: 1,
                        }}
                        onClick={ () => {
                            setChosenHint("AllSessions")
                            chart.chartData.chartHintUsed(600)
                        } }>
                        Показать все свои предыдущие сессии (600 очков)
                    </Button>
                </>
        }
    }

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
                <Stack justifyContent="space-between" alignContent="flex-start" display="flex" direction="row">
                    <Box sx={{ p: 2, height: 100, overflow: 'hidden' }} ref={containerRef}>
                        {/*{*/}
                        {/*    scoresChanges.map( text =>*/}
                        {/*        <Slide in={true} container={containerRef.current}>*/}
                        {/*            <Typography variant="h6">{text}</Typography>*/}
                        {/*        </Slide>*/}
                        {/*    )*/}
                        {/*}*/}
                        <Typography variant="h6">Очки: {chart.chartData.score}</Typography>
                    </Box>
                    <Button
                        sx={{
                            color: "#9356A0",
                            border: "#9356A0 1px solid",
                            height: 40,
                        }}
                        onClick={ () => { handleOpenRuleModal() } }>
                        Правила игры
                    </Button>
                </Stack>
                <Modal
                    sx={{
                        position: "fixed",
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                }}
                    open={isRuleModalOpened}
                    onClose={handleCloseRuleModal}
                >
                    <ModalContent sx={{ width: 800 }}>
                        <Typography>
                            Описание игры "Удержи процесс!"
                        </Typography>
                        <Typography>
                            В чем цель игры?
                        </Typography>
                        <Typography>
                            Вы будете наблюдать за процессом, который представлен в виде графика.
                            С течением времени значение процесса будет меняться.
                            Ваша цель - как можно дольше не допускать "взрыва процесса", то есть выхода его значения за верхнюю границу (красная линия).
                            В этом вам поможет система искусственного интеллекта, которая предупредит вас, если посчитает, что вскоре процесс выйдет за допустимые рамки.
                            Тем не менее изредка система может пропустить опасную ситуацию, а иногда наоборот - предупредит об опасности, когда ее на самом деле нет.
                        </Typography>
                        <Typography>
                            Как набирать очки?
                        </Typography>
                        <Typography>
                            За каждый пройденный процессом шаг вам будут добавляться очки.
                            В течение игры система искусственного интеллекта будет предупреждать вас об опасности и вы будете принимать решение, остановить или продолжить процесс.
                            Если вы остановите процесс, когда система ИИ предупредила вас об опасности, и она действительно была, вы получите дополнительные очки.
                            Если вы остановите процесс без предупреждения ИИ, и при этом через несколько шагов действительно бы произошел взрыв, то вы также получите очки.
                            Вы потеряете очки если ошибочно проигнорируете предупреждение системы ИИ или остановите процесс из-за ее предупреждения, когда опасности на самом деле не было.
                        </Typography>
                        <Typography>
                            Доступные действия
                        </Typography>
                        <Typography>
                            Чтобы запустить процесс, нажмите на кнопку "Начать игру!".
                            При помощи кнопок с иконками стрелочек, вы можете ускорять и замедлять процесс.
                            Кнопка "Пауза" позволит остановить время, чтобы у вас было больше времени подумать над тем, стоит ли остановить процесс или нет.
                            Для того, чтобы остановить процесс надо нажать на одноименную кнопку.
                            При возникновении предупреждения от системы ИИ, внизу экрана всплывет окно и процесс автоматически ставится на паузу.
                            В этом случае вы можете проигнорировать запросить подсказку для принятия решения, продолжить процесс и остановить процесс.
                        </Typography>
                    </ModalContent>
                </Modal>
                <Modal
                    sx={{
                        position: "fixed",
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    open={isHintModalOpened}
                    onClose={handleCloseHintModal}
                >
                    <ModalContent sx={{ width: 800 }}>
                        {renderHintModal(chosenHint)}
                    </ModalContent>
                </Modal>
                <Container sx={{width: '95%'}}>
                    <Chart
                        ref={chartRef}
                        options={options}
                        data={chart.chartData.data}
                        />
                    {
                        (isChartPaused && chart.chartData.data.labels.length === 0)
                            ? <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    width: "100%",
                                }}
                                onClick={ () => { setIsChartPaused(false) } }>
                                Начать игру!
                            </Button>
                            : <Stack display="flex" direction="column" spacing={1} >
                                <Stack display="flex" direction="row" spacing={1} >
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
                                            disabled={isDanger}
                                            onClick={ () => {
                                                setIsChartPaused(false)
                                                setIsDanger(false)
                                            } }
                                        >Продолжить
                                        </Button>
                                        : <Button
                                            sx={{
                                                color: "#FFFFFF",
                                                backgroundColor: "#9356A0",
                                                flexGrow: 1,
                                            }}
                                            onClick={ () => {
                                                setIsChartPaused(true)
                                                chart.chartData.chartPaused()
                                            } }>
                                            Пауза
                                        </Button>
                                    }
                                    <Button
                                        sx={{
                                            color: "#FFFFFF",
                                            backgroundColor: "#A05657",
                                            flexGrow: 1,
                                        }}
                                        disabled={isDanger}
                                        onClick={ () => {
                                            setIsChartStopped(true)
                                            setIsDanger(false)
                                        } }>
                                        Завершить процесс
                                    </Button>
                                </Stack>
                                { isChartPaused
                                    ? <Button
                                        sx={{
                                            color: "#FFFFFF",
                                            backgroundColor: "#9356A0",
                                            flexGrow: 1,
                                        }}
                                        onClick={ () => { handleOpenHintModal() } }>
                                        Купить подсказки
                                    </Button>
                                    : <></>
                                }
                            </Stack>
                    }
                </Container>
            </Box>
            {isDanger
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
                        <Stack direction="row" spacing={1} alignItems={"center"} >
                            <DangerIcon/>
                            <Typography>Внимание! Опасность взрыва! Решите, что делать!</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} >
                            <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    flexGrow: 1,
                                }}
                                onClick={ () => {
                                    setIsChartPaused(false)
                                    setIsDanger(false)
                                    handleCloseHintModal()
                                } }>
                                Продолжить процесс
                            </Button>
                            <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#9356A0",
                                    flexGrow: 1,
                                }}
                                onClick={ () => { handleOpenHintModal() } }>
                                Показать подсказку
                            </Button>
                            <Button
                                sx={{
                                    color: "#FFFFFF",
                                    backgroundColor: "#A05657",
                                    flexGrow: 1,
                                }}
                                onClick={ () => {
                                    setIsChartStopped(true)
                                    setIsDanger(false)
                                } }>
                                Завершить процесс
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