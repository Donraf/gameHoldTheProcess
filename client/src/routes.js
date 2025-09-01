import {
  ADMIN_GRAPH_ROUTE,
  ADMIN_PARSET_ROUTE,
  ADMIN_ROUTE,
  ADMIN_USER_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTRATION_ROUTE,
  RESEARCHER_ROOM_ROUTE,
  RESEARCHER_USER_ROUTE,
  USER_PROFILE_ROUTE,
} from "./utils/constants";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AdminUser from "./pages/AdminUser";
import UserProfile from "./pages/UserProfile";
import AdminGraph from "./pages/AdminGraph";
import ResearcherRoom from "./pages/ResearcherRoom";
import AdminParset from "./pages/AdminParSet";
import ResearcherUser from "./pages/ResearcherUser";

export const authRoutes = [
  {
    path: ADMIN_ROUTE,
    Component: <Admin />,
  },
  {
    path: ADMIN_USER_ROUTE,
    Component: <AdminUser />,
  },
  {
    path: ADMIN_GRAPH_ROUTE,
    Component: <AdminGraph />,
  },
  {
    path: ADMIN_PARSET_ROUTE,
    Component: <AdminParset />,
  },
  {
    path: USER_PROFILE_ROUTE,
    Component: <UserProfile />,
  },
  {
    path: RESEARCHER_ROOM_ROUTE,
    Component: <ResearcherRoom />,
  },
  {
    path: RESEARCHER_USER_ROUTE,
    Component: <ResearcherUser />,
  },
];

export const publicRoutes = [
  {
    path: LOGIN_ROUTE,
    Component: <Auth />,
  },
  {
    path: REGISTRATION_ROUTE,
    Component: <Auth />,
  },
  {
    path: HOME_ROUTE,
    Component: <Home />,
  },
];
