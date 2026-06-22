import React, { useContext, useEffect, useState } from "react";
import { Box, Card, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useSnackbar } from "notistack";
import { Context } from "../index";
import {
  ADMIN_ROUTE,
  HOME_ROUTE,
  RESEARCHER_ROOM_ROUTE,
  USER_ROLE_ADMIN,
  USER_ROLE_RESEARCHER,
  USER_ROLE_USER,
} from "../utils/constants";
import { getTestSessionStatus, submitTestResult } from "../http/testAPI";
import TestRenderer from "../features/tests/components/TestRenderer";

function getDefaultRouteForRole(role) {
  if (role === USER_ROLE_ADMIN) {
    return ADMIN_ROUTE;
  }
  if (role === USER_ROLE_RESEARCHER) {
    return RESEARCHER_ROOM_ROUTE;
  }
  return HOME_ROUTE;
}

const OnboardingTests = observer(() => {
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingTests, setPendingTests] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadSession = async () => {
    setLoading(true);
    try {
      const status = await getTestSessionStatus();
      if (!status.has_active_tests || status.all_completed) {
        navigate(HOME_ROUTE, { replace: true });
        return;
      }
      setPendingTests(status.pending_tests ?? []);
      setCurrentIndex(0);
    } catch (e) {
      enqueueSnackbar("Не удалось загрузить тесты", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.isAuth) {
      return;
    }
    if (user.user.role !== USER_ROLE_USER) {
      navigate(getDefaultRouteForRole(user.user.role), { replace: true });
      return;
    }
    loadSession();
  }, [user.isAuth, user.user.role, navigate]);

  const handleSubmit = async (answers) => {
    const currentTest = pendingTests[currentIndex];
    if (!currentTest) {
      return;
    }

    setSubmitting(true);
    try {
      await submitTestResult(currentTest.id, answers);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= pendingTests.length) {
        const status = await getTestSessionStatus();
        if (status.all_completed) {
          navigate(HOME_ROUTE, { replace: true });
          return;
        }
        await loadSession();
        return;
      }
      setCurrentIndex(nextIndex);
    } catch (e) {
      enqueueSnackbar("Не удалось сохранить результаты теста", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user.isAuth || user.user.role !== USER_ROLE_USER) {
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentTest = pendingTests[currentIndex];
  if (!currentTest) {
    return null;
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={2}>
      <Card sx={{ width: "100%", maxWidth: 720, p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4" align="center">
            Вступительные тесты
          </Typography>
          <Typography align="center" color="text.secondary">
            Тест {currentIndex + 1} из {pendingTests.length}
          </Typography>
          <Typography variant="h5">{currentTest.title}</Typography>
          {currentTest.description ? <Typography>{currentTest.description}</Typography> : null}
          <TestRenderer test={currentTest} onSubmit={handleSubmit} submitting={submitting} />
        </Stack>
      </Card>
    </Box>
  );
});

export default OnboardingTests;
