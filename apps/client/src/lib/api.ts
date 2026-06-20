import axios from "axios";
import type {
  APIAdminStats,
  APIAdminUser,
  APICurrentUser,
  APIFile,
  APIPOSTUserRegisterBody,
  SuccessAPIResponse,
} from "@/types/API";
import { API_URL } from "../config";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const registerUser = async ({
  email,
  first_name,
  last_name,
  password,
}: APIPOSTUserRegisterBody) => {
  const { data } = await api.post("/auth/register", {
    email,
    password,
    first_name,
    last_name,
  });

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
};

export const loginUser = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });

  return {
    message: data.message,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
};

export const getUser = async (): Promise<
  SuccessAPIResponse<APICurrentUser>
> => {
  const { data } = await api.get("/users/me");

  return data;
};

export const getUserFiles = async (): Promise<
  SuccessAPIResponse<{
    files: APIFile[];
    next_cursor?: string;
  }>
> => {
  const { data } = await api.get("/files");

  return {
    data: {
      files: data.data,
      next_cursor: data.next_cursor,
    },
    message: data.message,
  };
};

export const uploadFile = async (
  file: File,
): Promise<SuccessAPIResponse<APIFile>> => {
  const form = new FormData();
  form.append("file", file);

  const { data } = await api.post("/files/upload", form);

  return data;
};

export const deleteFile = async (fileId: string) => {
  await api.delete(`/files/${fileId}`);
};

export const updateUserProfile = async (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<SuccessAPIResponse<APICurrentUser>> => {
  const { data: response } = await api.patch("/users/me", data);
  return response;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
) => {
  const { data } = await api.patch("/users/me/password", {
    currentPassword,
    newPassword,
  });
  return data;
};

export const getAdminStats = async (): Promise<
  SuccessAPIResponse<APIAdminStats>
> => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export const getAdminUsers = async (): Promise<
  SuccessAPIResponse<APIAdminUser[]>
> => {
  const { data } = await api.get("/admin/users");
  return data;
};

export const updateAdminUser = async (
  id: string,
  body: { role?: string; quotaBytes?: string },
): Promise<SuccessAPIResponse<APIAdminUser>> => {
  const { data } = await api.patch(`/admin/users/${id}`, body);
  return data;
};

export const deleteAdminUser = async (id: string) => {
  await api.delete(`/admin/users/${id}`);
};
