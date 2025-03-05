import React, {useContext, useEffect, useState} from 'react';
import {Context} from "../index";
import {useNavigate} from "react-router-dom";
import {HOME_ROUTE, LOGIN_ROUTE} from "../utils/constants";
import {
    AppBar,
    Box,
    Button,
    CssBaseline,
    Pagination, Paper,
    Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField,
    Toolbar,
    Typography
} from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import ImageButton from "../components/ImageButton/ImageButton";
import DeleteIcon from "../components/icons/DeleteIcon";
import {useSnackbar} from "notistack";
import {deleteGraph, fetchGraphs, getGraphsPageCount} from "../http/graphAPI";

const AdminGraph = () => {
    const {user} = useContext(Context);
    const navigate = useNavigate();

    const logOut = () => {
        user.setUser({})
        user.setIsAuth(false)
        navigate(HOME_ROUTE)
    }

    const [updateTrigger, setUpdateTrigger] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [filterInput, setFilterInput] = useState("");
    const [filteredData, setFilteredData] = useState(null)
    const [page, setPage] = React.useState(1);
    const [pageCount, setPageCount] = React.useState(1);

    const [snackErrTexts, setSnackErrTexts] = React.useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        setIsDataFetched(false);
        filterData(false).then( () => {setIsDataFetched(true) } )
    }, [page])

    useEffect(() => {
        setIsDataFetched(false);
        filterData(true).then( () => {setIsDataFetched(true) } )
    }, [updateTrigger])

    useEffect(() => {
        snackErrTexts.map(text => enqueueSnackbar(text, {variant: "error", autoHideDuration: 3000, preventDuplicate: true}))
    },[snackErrTexts])

    const deleteGraphUi = (id) => {
        deleteGraph(id).then(
            _ => {
                enqueueSnackbar("Игра удалена", {variant: "success", autoHideDuration: 3000, preventDuplicate: true})
                setUpdateTrigger(!updateTrigger)
            },
            e => {
                let additionalText = ""
                if (e.message.includes("Нарушение ограничений")) additionalText = "\n" + e.message
                enqueueSnackbar("Ошибка при удалении игры" + additionalText, {variant: "error", autoHideDuration: 3000, preventDuplicate: true})
            }
        )
    }

    const filterData = async ( updatePage ) => {
        let filteredDataFromQuery
        let newPageCount
        if (filterInput) {
            filteredDataFromQuery = await fetchGraphs("chart_id", filterInput, page);
            newPageCount = await getGraphsPageCount("chart_id", filterInput)
        } else {
            filteredDataFromQuery = await fetchGraphs(null, null, page);
            newPageCount = await getGraphsPageCount()
        }
        setPageCount(newPageCount)
        if (updatePage) setPage(1)
        setFilteredData(filteredDataFromQuery);
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Панель администратора > Изменить пользователя
                    </Typography>
                    <Stack direction="row" spacing={2} >
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {user.user.login ? user.user.login : ""}
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
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
                <Toolbar />
                <Stack width={'100%'} direction="column" spacing={2}>
                    <Typography variant="h4" noWrap component="div">
                        Изменение пройденной игры
                    </Typography>
                    <TextField onChange={ event => {
                        setFilterInput(event.target.value);
                        setUpdateTrigger(!updateTrigger);
                    }}
                               value={filterInput}
                               id="outlined-basic"
                               label="Введите идентификатор игры"
                               variant="outlined"/>

                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell/>
                                    <TableCell>Логин игрока</TableCell>
                                        <TableCell>Идентификатор игры</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isDataFetched ?
                                    filteredData.map((graph) =>
                                        <TableRow
                                            key={graph.id}
                                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                        >
                                            <TableCell sx={{width: 75}}>
                                                <Stack direction="row" spacing={1}>
                                                    <ImageButton
                                                        onClick={() => {deleteGraphUi(graph.id)}}>
                                                        <DeleteIcon/>
                                                    </ImageButton>
                                                </Stack>
                                            </TableCell>
                                            <TableCell component="th" scope="row">{graph.id}</TableCell>
                                            <TableCell>???</TableCell>
                                        </TableRow>
                                    ) : <></>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    { isDataFetched
                        ? <Pagination sx={{pt: "16px"}} count={ pageCount } page={page} onChange={(event,value) => {setPage(value)}} variant="outlined" shape="rounded" />
                        : <></>
                    }
                </Stack>
            </Box>
        </Box>
    );
};

export default AdminGraph;