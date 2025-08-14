import React, {useContext, useEffect, useState} from 'react';
import dateFormat from "dateformat";
import {
    Box, Button,
    CssBaseline,
    MenuItem,
    Modal,
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
import AddIcon from '../components/icons/AddIcon';
import { COLORS } from '../utils/constants';
import { createGroup, fetchUsers, getAllGroups, getUsersPageCount } from '../http/userAPI';
import { ModalContent } from '../components/ModalContent';
import { Context } from '..';

const ResearcherRoom = () => {
    const {user} = useContext(Context);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [filterInput, setFilterInput] = useState("");
    const [filteredData, setFilteredData] = useState([])
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [fetchedGroups, setFetchedGroups] = useState([])
    const [selectedGroupName, setSelectedGroupName] = useState("")
    const [name, setName] = useState("");

    const [isCreateGroupModalOpened, setIsCreateGroupModalOpened] = React.useState(false);
    const handleOpenCreateGroupModal = () => setIsCreateGroupModalOpened(true);
    const handleCloseCreateGroupModal = () => setIsCreateGroupModalOpened(false);

    const [snackErrTexts, setSnackErrTexts] = React.useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchGroups()
    }, [])

    useEffect(() => {
        setIsDataFetched(false);
        filterData(false).then( () => {setIsDataFetched(true) } )
    }, [page])

    useEffect(() => {
        setIsDataFetched(false);
        filterData(true).then( () => {setIsDataFetched(true) } )
    }, [filterInput])

    useEffect(() => {
        snackErrTexts.map(text => enqueueSnackbar(text, {variant: "error", autoHideDuration: 3000, preventDuplicate: true}))
    },[snackErrTexts])

    const tryCreateGroup = () => {
        let snackErrors = []
        if (name === "") {snackErrors.push("Введите наименование производителя")}
        if (snackErrors.length !== 0){
            setSnackErrTexts(snackErrors)
            return
        }

        createGroup(name, user.user.user_id)
            .then(
                _ => {
                    enqueueSnackbar("Группа добавлена", {variant: "success", autoHideDuration: 3000, preventDuplicate: true})
                    setName('');
                    fetchGroups();
                },
                _ => {
                enqueueSnackbar("Ошибка при добавлении группы", {variant: "error", autoHideDuration: 3000, preventDuplicate: true})
                }
            )
    }

    const fetchGroups = () => {
        getAllGroups().then(
            (data) => {
                setFetchedGroups(data)
            }
        )
    }

    const filterData = async ( updatePage ) => {
        let filteredDataFromQuery
        let newPageCount
        if (filterInput) {
            filteredDataFromQuery = await fetchUsers("group_name", filterInput, page);
            newPageCount = await getUsersPageCount("group_name", filterInput)
        } else {
            filteredDataFromQuery = await fetchUsers(null, null, page);
            newPageCount = await getUsersPageCount()
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
                <Modal
                    sx={{
                        position: "fixed",
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                }}
                    open={isCreateGroupModalOpened}
                    onClose={handleCloseCreateGroupModal}
                >
                    <ModalContent sx={{ width: 800 }}>
                        <Typography variant="h4" noWrap component="div">
                            Добавление новой группы
                        </Typography>
                        <TextField onChange={ event => {setName(event.target.value)}}
                                value={name}
                                id="outlined-basic"
                                label="Введите наименование группы"
                                required={true}
                                variant="outlined"/>
                        <Button sx={{width:"fit-content", height: "40px"}} variant="contained"
                                onClick={() => {tryCreateGroup()}}>
                            Добавить группу
                        </Button>
                    </ModalContent>
                </Modal>
                <Stack width={'100%'} direction="column" spacing={2}>
                    <Typography variant="h4" noWrap component="div">
                        Выбрать группу участников
                    </Typography>
                    <Stack direction="row" gap={1}>
                        <TextField
                            select
                            value={selectedGroupName}
                            onChange={(event) => {
                                const newSelectedGroupName = event.target.value
                                setSelectedGroupName(newSelectedGroupName)
                                setFilterInput(newSelectedGroupName)
                            }}
                            id="group-select"
                            variant={"outlined"}
                            sx={{
                                flexGrow: 9,
                            }}
                        >
                            {fetchedGroups.map((item) =>
                                <MenuItem id={ "groupItem" + item.id} value={item.name}>
                                    {item.name}
                                </MenuItem>
                            )}
                        </TextField>
                        
                        <Button
                        variant="outlined"
                            sx={{
                                color: "#FFFFFF",
                                backgroundColor: COLORS.mainTheme,
                                flexGrow: 1,
                            }}
                            onClick={ () => { handleOpenCreateGroupModal() } }
                            startIcon={<AddIcon/>}
                            >
                            Добавить группу
                        </Button>
                    </Stack>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell/>
                                    <TableCell>Логин игрока</TableCell>
                                    <TableCell>ID игрока</TableCell>
                                    <TableCell>ФИО игрока</TableCell>
                                    <TableCell>Время добавления</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isDataFetched ?
                                    filteredData.map((user) =>
                                        <TableRow
                                            key={user.id}
                                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                        >
                                            <TableCell sx={{width: 75}}>
                                                <Stack direction="row" spacing={1}>
                                                    <ImageButton
                                                        onClick={() => {}}>
                                                        <DeleteIcon/>
                                                    </ImageButton>
                                                </Stack>
                                            </TableCell>
                                            <TableCell component="th" scope="row">{user.login}</TableCell>
                                            <TableCell>{user.user_id}</TableCell>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{dateFormat(user.created_at, 'yyyy-mm-dd HH:MM:ss')}</TableCell>
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

export default ResearcherRoom;