import React, { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "../index";
import { ONBOARDING_TESTS_ROUTE, USER_ROLE_USER } from "../utils/constants";
import { getTestSessionStatus } from "../http/testAPI";

const TestGate = observer(({ children }) => {
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user.isAuth || user.user.role !== USER_ROLE_USER) {
      return;
    }
    if (location.pathname === ONBOARDING_TESTS_ROUTE) {
      return;
    }

    getTestSessionStatus()
      .then((status) => {
        if (status.has_active_tests && !status.all_completed) {
          navigate(ONBOARDING_TESTS_ROUTE, { replace: true });
        }
      })
      .catch(() => {});
  }, [user.isAuth, user.user.role, location.pathname, navigate]);

  return children;
});

export default TestGate;
