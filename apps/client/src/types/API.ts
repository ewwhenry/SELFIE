export interface SuccessAPIResponse<T> {
  message: string;
  data: T;
}

export interface APICurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  usedBytes: string;
  quotaBytes: string;
}

export interface APIPOSTUserRegisterBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export type APIFile = {
  id: string;
  userId: string;
  originalName: string;
  storedName: string;
  sizeBytes: string;
};
