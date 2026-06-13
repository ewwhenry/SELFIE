export type JWTPayload = {
  sub: string;
  role: "USER" | "ADMIN";
  iat: number;
  exp: number;
};
