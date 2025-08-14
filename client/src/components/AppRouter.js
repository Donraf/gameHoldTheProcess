import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { authRoutes, publicRoutes } from "../routes";
import Forbidden from "../pages/Forbidden";
import { Context } from "../index";
import { observer } from "mobx-react-lite";

const AppRouter = observer(() => {
  const { user } = useContext(Context);

  return (
    <Routes>
      {user.isAuth &&
        authRoutes.map(({ path, Component }) => <Route key={path} path={path} element={Component} exact />)}
      {publicRoutes.map(({ path, Component }) => (
        <Route key={path} path={path} element={Component} exact />
      ))}
      <Route path="*" element=<Forbidden /> />
    </Routes>
  );
});

export default AppRouter;
