/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { ModuleForm } from "@/components/Modules/type";
import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling";
import { getCurrentUser } from "./UserSessison";

export const getModules = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const include = hasChildren ? { tabs: true } : {};
  try {
    return await prisma.module.findMany({
      where: { deletedAt: null, ...where },
      include,
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

export const getModuleById = async (id: string) => {
  try {
    return prisma.module.findUnique({
      include: { tabs: true },
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createModule = async (data: ModuleForm) => {
  try {
    const user = await getCurrentUser();
    return await prisma.module.create({
      data: {
        ...data,
        createdBy: user.id,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updateModule = async (id: string, data: ModuleForm) => {
  try {
    const user = await getCurrentUser();
    return prisma.module.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const deleteModule = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.module.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const restoreModule = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.module.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        updatedBy: user.id,
        deletedAt: null,
        deletedBy: null,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};