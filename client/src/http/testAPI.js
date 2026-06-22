import { $authHost } from "./index";
import {
  USER_ROLE_ADMIN,
  USER_ROLE_RESEARCHER,
  USER_ROLE_USER,
} from "../utils/constants";

export const getTestSessionStatus = async () => {
  const { data } = await $authHost.get("api/test/session");
  return data;
};

export const submitTestResult = async (testId, answers) => {
  const { data } = await $authHost.post("api/test/results", {
    test_id: testId,
    answers,
  });
  return data;
};

export const fetchAllTests = async () => {
  const { data } = await $authHost.get("api/test/");
  return data.data ?? [];
};

export const fetchPlayerTestResults = async (userId) => {
  const { data } = await $authHost.get(`api/test/results/user/${userId}`);
  return data.data ?? [];
};

export const createTest = async (test) => {
  const { data } = await $authHost.post("api/test/", test);
  return data;
};

export const updateTest = async (id, test) => {
  const { data } = await $authHost.put(`api/test/${id}`, test);
  return data;
};

export const deleteTest = async (id) => {
  const { data } = await $authHost.delete(`api/test/${id}`);
  return data;
};

export const resolvePostAuthRoute = async (
  role,
  homeRoute,
  researcherRoute,
  onboardingRoute,
  adminRoute
) => {
  if (role === USER_ROLE_RESEARCHER) {
    return researcherRoute;
  }
  if (role === USER_ROLE_ADMIN) {
    return adminRoute;
  }
  if (role !== USER_ROLE_USER) {
    return homeRoute;
  }

  const status = await getTestSessionStatus();
  if (status.has_active_tests && !status.all_completed) {
    return onboardingRoute;
  }
  return homeRoute;
};
