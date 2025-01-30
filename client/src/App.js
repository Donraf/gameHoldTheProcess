import React, {useContext, useEffect, useState} from "react";
import {BrowserRouter} from "react-router-dom";
import AppRouter from "./components/AppRouter";
import {observer} from "mobx-react-lite";
import {Context} from "./index";
import {check} from "./http/userAPI";

const App = observer( () => {
    const {user} = useContext(Context);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        check().then(
            data => {
                if (data !== undefined) {
                    user.setUser(data);
                    user.setIsAuth(true);
                }
            },
            (reason) => {
                console.log("REASON:");
                console.log(reason)
            }
        ).finally(() => setLoading(false));
    }, [])

    if (loading) {
        return (<div>Loading...</div>)
    }

    return (
        <BrowserRouter>
            <AppRouter />
        </BrowserRouter>
    );
})

export default App;