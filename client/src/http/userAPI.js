import { $authHost, $host } from "./index";
import { jwtDecode } from "jwt-decode";
import { USER_ROLE_USER } from "../utils/constants";

export const createUser = async (login, password, name, role, groupId = null) => {
  try {
    const { data } = await $authHost.post("api/user/registration", {
      login: login,
      password: password,
      role: role,
      name: name,
      group_id: groupId,
    });
    return jwtDecode(data.token);
  } catch (e) {
    throw new Error("Error when creating a user\n" + e);
  }
};

export const registration = async (login, password, name, groupId = null) => {
  try {
    const { data } = await $host.post("api/user/registration", {
      login: login,
      password: password,
      role: USER_ROLE_USER,
      name: name,
      group_id: groupId,
    });
    localStorage.setItem("token", data.token);
    return jwtDecode(data.token);
  } catch (e) {
    throw new Error("Error on registration\n" + e);
  }
};

export const login = async (login, password) => {
  try {
    const { data } = await $host.post("api/user/login", { login, password });
    localStorage.setItem("token", data.token);
    return jwtDecode(data.token);
  } catch (e) {
    throw new Error("Error on login\n" + e);
  }
};

export const check = async () => {
  try {
    const { data } = await $authHost.get("api/user/auth");
    localStorage.setItem("token", data.token);
    return jwtDecode(data.token);
  } catch (e) {
    throw new Error("Error on check\n" + e);
  }
};

export const getUsersPageCount = async (filterTag = null, filterValue = null) => {
  try {
    const pageCount = await $authHost.post("api/user/pageCount", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
    });
    return pageCount.data.pageCount;
  } catch (e) {
    throw e;
  }
};

export const getParSet = async (id) => {
  try {
    const { data } = await $authHost.get(`api/user/parSet/${id}`);
    return data.data;
  } catch (e) {
    throw new Error("Error on getUserParSet\n" + e);
  }
};

export const getScore = async (userId, parSetId) => {
  try {
    const { data } = await $authHost.get(`api/user/score/${userId}/${parSetId}`);
    return data.data;
  } catch (e) {
    throw new Error("Error on getScore\n" + e);
  }
};

export const getUserParSet = async (userId, parSetId) => {
  try {
    const { data } = await $authHost.get(`api/user/userParSet/${userId}/${parSetId}`);
    return data.data;
  } catch (e) {
    throw new Error("Error on getUserParSet\n" + e);
  }
};

export const fetchUsers = async (filterTag = null, filterValue = null, currentPage = null) => {
  try {
    const { data } = await $authHost.post("api/user/users", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
      current_page: currentPage,
    });
    if (data.data === null || data.data.length === 0) {
      return [];
    }
    return data.data;
  } catch (e) {
    throw e;
  }
};

export const fetchUser = async (id) => {
  try {
    const { data } = await $authHost.get(`api/user/${id}`);
    return data;
  } catch (e) {
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    await $authHost.delete(`api/user/${id}`);
  } catch (e) {
    if (e.response.status === 527) {
      throw new Error(e.response.data.message);
    }
    throw e;
  }
};

export const updateUser = async (id, updateInfo) => {
  try {
    const { data } = await $authHost.put(`api/user/${id}`, updateInfo);
    return data;
  } catch (e) {
    throw e;
  }
};

export const createGroup = async (name, userId) => {
  try {
    const { data } = await $authHost.post("api/user/group", {
      creator_id: userId,
      name: name,
    });
    return data;
  } catch (e) {
    throw new Error("Error when creating a user\n" + e);
  }
};

export const getAllGroups = async () => {
  try {
    const { data } = await $authHost.get(`api/user/groups`);
    if (data.data === null || data.data.length === 0) {
      return [];
    }
    return data.data;
  } catch (e) {
    throw e;
  }
};

export const getPlayersStat = async (filterTag = null, filterValue = null, currentPage = null) => {
  try {
    const { data } = await $authHost.post("api/user/playersStat", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
      current_page: currentPage,
    });
    if (data.data === null || data.data.length === 0) {
      return [];
    }
    return data.data;
  } catch (e) {
    throw e;
  }
};

export const getPlayersPageCount = async (filterTag = null, filterValue = null) => {
  try {
    const pageCount = await $authHost.post("api/user/playersPageCount", {
      filter_tag: filterTag,
      filter_value: String(filterValue),
    });
    return pageCount.data.pageCount;
  } catch (e) {
    throw e;
  }
};

export const getPlayersEvents = async (userId, parSetId, page, groupedBy) => {
  try {
    const { data } = await $authHost.post("api/user/playersEvents", {
      user_id: userId,
      par_set_id: parSetId,
      current_page: page,
      grouped_by: groupedBy,
    });
    if (data.data === null || data.data.length === 0) {
      return [];
    }
    return data.data;
  } catch (e) {
    throw e;
  }
};

export const getPlayersEventsPageCount = async (userId, parSetId, groupedBy) => {
  try {
    const pageCount = await $authHost.post("api/user/playersEventsPageCount", {
      user_id: userId,
      par_set_id: parSetId,
      grouped_by: groupedBy,
    });
    return pageCount.data.pageCount;
  } catch (e) {
    throw e;
  }
};

export const updateUserParSet = async (userId, parSetId) => {
  try {
    const { data } = await $authHost.put(`api/user/${userId}/parSet`, {
      par_set_id: parSetId,
    });
    return data;
  } catch (e) {
    throw e;
  }
};

export const updateUserUserParSet = async (id, updateInfo) => {
  try {
    const { data } = await $authHost.put(`api/user/${id}/userParSet`, updateInfo);
    return data;
  } catch (e) {
    throw e;
  }
};