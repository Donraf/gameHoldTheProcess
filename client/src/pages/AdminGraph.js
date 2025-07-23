import React, {useEffect, useState} from 'react';
import dateFormat from "dateformat";
import {
    Box,
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
                                    <TableCell>ID игрока</TableCell>
                                    <TableCell>ID игры</TableCell>
                                    <TableCell>Время добавления</TableCell>
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
                                            <TableCell component="th" scope="row">{graph.user_id}</TableCell>
                                            <TableCell>{graph.user_id}</TableCell>
                                            <TableCell>{graph.id}</TableCell>
                                            <TableCell>{dateFormat(graph.updatedAt, 'yyyy-mm-dd HH:MM:ss')}</TableCell>
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