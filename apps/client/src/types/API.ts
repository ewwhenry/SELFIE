export interface SuccessAPIResponse<T> {
  message: string;
  data: T;
}

export interface APIUserSession {
  id: string;
  userId: string;
  expiresAt: string;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  lastActiveAt: string | null;
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
  mimeType: string;
  sizeBytes: string;
  path: string;
  folderId: string | null;
  shareToken: string | null;
  shareExpiresAt: string | null;
  createdAt: string;
};

export type APIFolder = {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { files: number };
};

export type APISharedFile = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  createdAt: string;
};

export interface APIAdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  quotaBytes: string;
  usedBytes: string;
  fileCount: number;
  createdAt: string;
}

export interface APIAdminStats {
  userCount: number;
  fileCount: number;
  totalStorageBytes: string;
}
