/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { RoleForm } from "@/components/Roles/type";
import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling";

export const getRoles = async (whereClause?: Record<string, any>) => {
  const where = whereClause ? whereClause : {};
  try {
    return await prisma.role.findMany({
      where: { deletedAt: null, ...where },
      orderBy: {
        title: "asc",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const getRoleById = async (id: string, includeUsers = false) => {
  try {
    const include = includeUsers ? { users: true } : {};
    return prisma.role.findUnique({
      include,
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createRole = async (data: RoleForm) => {
  try {
    return await prisma.role.create({
      data,
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updateRole = async (id: string, data: RoleForm) => {
  try {
    return prisma.role.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const deleteRole = async (id: string) => {
  try {
    return prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const restoreRole = async (id: string) => {
  try {
    return prisma.role.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};