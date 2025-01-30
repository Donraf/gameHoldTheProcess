import {
    ADMIN_ROUTE,
    ADMIN_USER_ROUTE,
    HOME_ROUTE,
    LOGIN_ROUTE,
    REGISTRATION_ROUTE,
    USER_PROFILE_ROUTE,
} from "./utils/constants";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AdminUser from "./pages/AdminUser";
import UserProfile from "./pages/UserProfile";

export const authRoutes = [
    {
        path: ADMIN_ROUTE,
        Component: <Admin />
    },
    {
        path: ADMIN_USER_ROUTE,
        Component: <AdminUser />
    },
    {
        path: USER_PROFILE_ROUTE,
        Component: <UserProfile />
    },
]

export const publicRoutes = [
    {
        path: LOGIN_ROUTE,
        Component: <Auth />
    },
    {
        path: REGISTRATION_ROUTE,
        Component: <Auth />
    },
    {
        path: HOME_ROUTE,
        Component: <Home />
    },
]
