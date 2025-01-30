import {Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar} from "@mui/material";
import React, {useContext} from "react";
import {useNavigate} from "react-router-dom";
import {ADMIN_ROUTE, HOME_ROUTE, USER_PROFILE_ROUTE, USER_ROLE_ADMIN} from "../utils/constants";
import {Context} from "../index";
import ProfileNavIcon from "./icons/ProfileNavIcon";
import AdminNavIcon from "./icons/AdminNavIcon";
import StartGameNavIcon from "./icons/StartGameNavIcon";

export const drawerWidth = 240;

export default function NavBarDrawer() {
    const navigate = useNavigate()
    const {user, navBar} = useContext(Context);

    let listItems = [
        {name: 'Начать игру', route: HOME_ROUTE, icon: <StartGameNavIcon/>},
        {name: 'Профиль', route: USER_PROFILE_ROUTE, icon: <ProfileNavIcon/>},
    ]

    if (user.user !== undefined && user.user.role === USER_ROLE_ADMIN) {
        listItems = [{name: 'Панель администратора', route: ADMIN_ROUTE, icon: <AdminNavIcon/>}].concat(listItems)
    }

    return (
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar />
            <Divider />
            <List>
                {listItems.map(item =>
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
            </List>
        </Drawer>
    )
}