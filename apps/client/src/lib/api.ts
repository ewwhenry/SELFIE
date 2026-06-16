import axios from "axios";
import type { SuccessAPIResponse } from "@/types/API";
import { API_URL } from "../config";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const registerUser = async (email: string, password: string) => {
  const { data } = await api.post("/auth/register", {
    email,
    password,
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
  SuccessAPIResponse<{
    id: string;
    email: string;
    role: string;
    usedBytes: string;
    quotaBytes: string;
  }>
> => {
  const { data } = await api.get("/users/me");

  return data;
};
