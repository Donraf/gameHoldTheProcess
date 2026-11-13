import {
  ADMIN_GRAPH_ROUTE,
  ADMIN_PARSET_ROUTE,
  ADMIN_ROUTE,
  ADMIN_TESTS_ROUTE,
  ADMIN_USER_ROUTE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  ONBOARDING_TESTS_ROUTE,
  REGISTRATION_ROUTE,
  ADMIN_GROUP_ROUTE,
  RESEARCHER_ROOM_ROUTE,
  RESEARCHER_USER_ROUTE,
  USER_PROFILE_ROUTE,
  USER_ROLE_ADMIN,
  USER_ROLE_RESEARCHER,
  USER_ROLE_USER,
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
import AdminGroup from "./pages/AdminGroup";
import AdminTests from "./pages/AdminTests";
import OnboardingTests from "./pages/OnboardingTests";

const ADMIN_AND_RESEARCHER = [USER_ROLE_ADMIN, USER_ROLE_RESEARCHER];
const ALL_ROLES = [USER_ROLE_USER, USER_ROLE_ADMIN, USER_ROLE_RESEARCHER];

export const authRoutes = [
  {
    path: ADMIN_ROUTE,
    Component: <Admin />,
    roles: [USER_ROLE_ADMIN],
  },
  {
    path: ADMIN_USER_ROUTE,
    Component: <AdminUser />,
    roles: [USER_ROLE_ADMIN],
  },
  {
    path: ADMIN_GRAPH_ROUTE,
    Component: <AdminGraph />,
    roles: [USER_ROLE_ADMIN],
  },
  {
    path: ADMIN_PARSET_ROUTE,
    Component: <AdminParset />,
    roles: [USER_ROLE_ADMIN],
  },
  {
    path: ADMIN_TESTS_ROUTE,
    Component: <AdminTests />,
    roles: [USER_ROLE_ADMIN],
  },
  {
    path: USER_PROFILE_ROUTE,
    Component: <UserProfile />,
    roles: ALL_ROLES,
  },
  {
    path: RESEARCHER_ROOM_ROUTE,
    Component: <ResearcherRoom />,
    roles: ADMIN_AND_RESEARCHER,
  },
  {
    path: RESEARCHER_USER_ROUTE + "/:userId",
    Component: <ResearcherUser />,
    roles: ADMIN_AND_RESEARCHER,
  },
  {
    path: ADMIN_GROUP_ROUTE,
    Component: <AdminGroup />,
    roles: [USER_ROLE_ADMIN],
  },
  {
    path: ONBOARDING_TESTS_ROUTE,
    Component: <OnboardingTests />,
    roles: [USER_ROLE_USER],
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
