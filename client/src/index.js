import React, {createContext} from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UserStore from "./store/UserStore";
import NavBarStore from "./store/NavBarStore";
import {SnackbarProvider} from "notistack";

export const Context = createContext(null);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Context.Provider value={{
        user: new UserStore(),
        navBar: new NavBarStore()
    }}>
        <SnackbarProvider>
            <App />
        </SnackbarProvider>
    </Context.Provider>
);
