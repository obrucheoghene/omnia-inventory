import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      username: string;
      role: "SUPER_USER" | "EDITOR" | "VIEWER";
    };
  }

  interface User {
    id: string;
    name: string;
    email?: string | null;
    username: string;
    role: "SUPER_USER" | "EDITOR" | "VIEWER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    role: string;
    username: string;
  }
}

export type UserRole = "SUPER_USER" | "EDITOR" | "VIEWER";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}
