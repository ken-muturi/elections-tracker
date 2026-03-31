/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling";
import { omit } from "lodash";
import { getCurrentUser } from "./UserSessison";

export const getPermissions = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const include = hasChildren ? { tab: true, role: true, module: true } : {};
  try {
    return await prisma.permission.findMany({
      where: { deletedAt: null, ...where },
      include,
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const getPermissionById = async (
  roleId: string,
  moduleId: string,
  tabId: string,
  action: string
) => {
  try {
    return prisma.permission.findUnique({
      include: { tab: true, role: true, module: true },
      where: {
        moduleId_tabId_roleId_action: { roleId, moduleId, tabId, action },
        deletedAt: null,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const getPermissionByRole = async (role: string) => {
  try {
    return prisma.permission.findMany({
      include: { tab: true, role: true, module: true },
      where: {
        role: {
          title: role,
        },
        deletedAt: null,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createPermission = async (data: {
  roleId: string;
  moduleId: string;
  tabId: string;
  action: string;
}) => {
  try {
    const user = await getCurrentUser();
    return await prisma.permission.create({
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

export const updatePermission = async (data: {
  roleId: string;
  moduleId: string;
  tabId: string;
  action: string;
}) => {
  try {
    const user = await getCurrentUser();
    const { roleId, moduleId, tabId, action } = data;
    return prisma.permission.update({
      where: {
        moduleId_tabId_roleId_action: { roleId, moduleId, tabId, action },
      },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
    });
  } catch (error) {
    console.error("Error updating permission:", error);
    throw error;
  }
};

export const upsertPermission = async (details: {
  roleId: string;
  moduleId: string;
  tabId: string;
  action: string;
  selected: boolean;
}) => {
  try {
    const user = await getCurrentUser();
    const { roleId, moduleId, tabId, action, selected } = details;
    const data = omit(details, "selected");
    if (selected === false) {
      await deletePermission(data);
    }

    return prisma.permission.upsert({
      where: {
        moduleId_tabId_roleId_action: { roleId, moduleId, tabId, action },
      },
      update: {
        ...data,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      create: {
        ...data,
        createdBy: user.id,
      },
    });
  } catch (error) {
    console.error("Error updating permission:", error);
    throw error;
  }
};

export const deletePermission = async (data: {
  roleId: string;
  moduleId: string;
  tabId: string;
  action: string;
}) => {
  try {
    const user = await getCurrentUser();
    const { roleId, moduleId, tabId, action } = data;
    return prisma.permission.update({
      where: {
        moduleId_tabId_roleId_action: { roleId, moduleId, tabId, action },
      },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
  } catch (error) {
    console.error("Error deleting permission:", error);
    throw error;
  }
};

export const restorePermission = async (data: {
  roleId: string;
  moduleId: string;
  tabId: string;
  action: string;
}) => {
  try {
    const user = await getCurrentUser();
    const { roleId, moduleId, tabId, action } = data;
    return prisma.permission.update({
      where: {
        moduleId_tabId_roleId_action: { roleId, moduleId, tabId, action },
      },
      data: {
        updatedAt: new Date(),
        updatedBy: user.id,
      },
    });
  } catch (error) {
    console.error("Error deleting permission:", error);
    throw error;
  }
};