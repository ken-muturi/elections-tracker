"use server"

import { TabForm } from "@/components/Tabs/type";
import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling";
import { getCurrentUser } from "./UserSessison";

export const getTabs = async () => {
  try {
    return await prisma.tab.findMany({
      where: { deletedAt: null },
      include: {
        module: true,
      },
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

export const getTabById = async (id: string) => {
  try {
    return prisma.tab.findUnique({
      include: { module: true },
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createTab = async (data: TabForm) => {
  try {
    const user = await getCurrentUser();
    return await prisma.tab.create({
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

export const updateTab = async (id: string, data: TabForm) => {
  try {
    const user = await getCurrentUser();
    return prisma.tab.update({
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

export const deleteTab = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.tab.update({
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

export const restoreTab = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.tab.update({
      where: { id },
      data: {
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