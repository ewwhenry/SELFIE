import axios from "axios";
import type {
  APIAdminStats,
  APIAdminUser,
  APICurrentUser,
  APIFile,
  APIFolder,
  APIPOSTUserRegisterBody,
  APISharedFile,
  APIUserSession,
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

export const getFolders = async (): Promise<
  SuccessAPIResponse<APIFolder[]>
> => {
  const { data } = await api.get("/folders");
  return data;
};

export const createFolder = async (
  name: string,
  parentId?: string,
): Promise<SuccessAPIResponse<APIFolder>> => {
  const { data } = await api.post("/folders", { name, parentId });
  return data;
};

export const renameFolder = async (
  folderId: string,
  name: string,
): Promise<SuccessAPIResponse<APIFolder>> => {
  const { data } = await api.patch(`/folders/${folderId}`, { name });
  return data;
};

export const deleteFolder = async (folderId: string) => {
  await api.delete(`/folders/${folderId}`);
};

export const setFileFolder = async (
  fileId: string,
  folderId: string | null,
): Promise<SuccessAPIResponse<APIFile>> => {
  const { data } = await api.put(`/files/${fileId}/folder`, { folderId });
  return data;
};

export const getUserSharedFiles = async (): Promise<
  SuccessAPIResponse<APIFile[]>
> => {
  const { data } = await api.get("/files/shared");
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

export type ImportResult = {
  imported: { originalName: string; id: string }[];
  skipped: string[];
  errors: { file: string; error: string }[];
};

export const importArchive = async (
  file: File,
): Promise<SuccessAPIResponse<ImportResult>> => {
  const { data } = await api.post("/files/import", file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Filename": encodeURIComponent(file.name),
    },
    timeout: 300000,
  });
  return data;
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

export const getTunnelStatus = async (): Promise<
  SuccessAPIResponse<{
    installed: boolean;
    version?: string;
    running: boolean;
    tunnelName?: string;
  }>
> => {
  const { data } = await api.get("/tunnel/status");
  return data;
};

export const startTunnel = async (tunnelName: string) => {
  const { data } = await api.post("/tunnel/start", { tunnelName });
  return data;
};

export const stopTunnel = async () => {
  const { data } = await api.post("/tunnel/stop");
  return data;
};

export const shareFile = async (
  fileId: string,
  ttlDays?: number,
): Promise<SuccessAPIResponse<APIFile>> => {
  const { data } = await api.post(`/files/${fileId}/share`, { ttlDays });
  return data;
};

export const unshareFile = async (
  fileId: string,
): Promise<SuccessAPIResponse<APIFile>> => {
  const { data } = await api.delete(`/files/${fileId}/share`);
  return data;
};

export const getSharedFile = async (
  token: string,
): Promise<SuccessAPIResponse<APISharedFile>> => {
  const { data } = await axios.get(`${API_URL}/s/${token}`);
  return data;
};

export const getUserSessions = async (): Promise<
  SuccessAPIResponse<APIUserSession[]>
> => {
  const { data } = await api.get("/users/me/sessions");
  return data;
};

export const revokeSession = async (sessionId: string) => {
  await api.delete(`/users/me/sessions/${sessionId}`);
};
