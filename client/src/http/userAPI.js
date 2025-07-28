import {$authHost, $host} from "./index";
import {jwtDecode} from "jwt-decode";
import {USER_ROLE_ADMIN, USER_ROLE_USER} from "../utils/constants";

export const createUser = async (user) => {
    try {
        const {data} = await $authHost.post('api/user/registration', user);
        return jwtDecode(data.token);
    } catch (e) {
        throw new Error("Error when creating a user\n" + e)
    }
}

export const registration = async (login, password) => {
    try {
        const {data} = await $host.post('api/user/registration', {login: login,
            password: password, role: USER_ROLE_USER});
        localStorage.setItem('token', data.token);
        return jwtDecode(data.token);
    } catch (e) {
        throw new Error("Error on registration\n" + e)
    }
}

export const login = async (login, password) => {
    try {
        const {data} = await $host.post('api/user/login', {login, password});
        localStorage.setItem('token', data.token);
        return jwtDecode(data.token);
    } catch (e) {
        throw new Error("Error on login\n" + e)
    }
}

export const check = async () => {
    try {
        const {data} = await $authHost.get('api/user/auth');
        localStorage.setItem('token', data.token);
        return jwtDecode(data.token);
    } catch (e) {
        throw new Error("Error on check\n" + e)
    }
}

export const getUsersPageCount = async (filterTag = null, filterValue = null) => {
    try {
        const pageCount = await $host.post('api/user/pageCount',
            {
                filter_tag: filterTag,
                filter_value: filterValue,
            }
        );
        return pageCount.data.pageCount;
    } catch (e) {
        throw e;
    }
}

export const getUserParSet = async (id) => {
    try {
        const {data} = await $host.get(`api/user/parSet/${id}`);
        return data;
    } catch (e) {
        throw new Error("Error on getUserParSet\n" + e)
    }
}

export const fetchUsers = async (filterTag = null, filterValue = null, currentPage = null) => {
    try {
        const {data} = await $host.post('api/user/users',
            {
                filter_tag: filterTag,
                filter_value: filterValue,
                current_page: currentPage,
            }
        );
        return data;
    } catch (e) {
        throw e;
    }
}

export const fetchUser = async (id) => {
    try {
        const {data} = await $host.get(`api/user/${id}`);
        return data;
    } catch (e) {
        throw e;
    }
}

export const deleteUser = async (id) => {
    try {
        await $authHost.delete(`api/user/${id}`);
    } catch (e) {
        if (e.response.status === 527) {
            throw new Error(e.response.data.message);
        }
        throw e;
    }
}

export const updateUser = async (id, updateInfo) => {
    try {
        const {data} = await $authHost.put(`api/user/${id}`, updateInfo);
        return data;
    } catch (e) {
        throw e;
    }
}
