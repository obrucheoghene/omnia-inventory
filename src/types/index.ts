import { Inflow } from "@/lib/db/schema";

export interface User {
  id: string;
  name: string;
  username: string;
  role: "SUPER_USER" | "EDITOR" | "VIEWER";
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
