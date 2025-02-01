import React, {createContext} from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UserStore from "./store/UserStore";
import NavBarStore from "./store/NavBarStore";
import {SnackbarProvider} from "notistack";
import {createTheme, ThemeOptions, ThemeProvider} from "@mui/material";

export const themeOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: '#724C9D',
        },
        secondary: {
            main: '#f50057',
        },
    },
};

const theme = createTheme(themeOptions);

export const Context = createContext(null);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Context.Provider value={{
        user: new UserStore(),
        navBar: new NavBarStore()
    }}>
        <SnackbarProvider>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </SnackbarProvider>
    </Context.Provider>
);
