/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { UnitSaveFields } from "@/components/Builder/Units/type";
import prisma from "@/db";
import { handleReturnError } from "@/db/error-handling";
import { omit } from "lodash";

export const getUnits = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const include = hasChildren ? { section: true, questions: true } : {};
  try {
    return await prisma.unit.findMany({
      where: { deletedAt: null, ...where },
      include,
      orderBy: {
        sortOrder: "asc",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const getUnitById = async (id: string) => {
  try {
    return prisma.unit.findUnique({
      include: { questions: true },
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createUnit = async (data: UnitSaveFields) => {
  try {
    const lastSection = await prisma.unit.findFirst({
      where: {
        sectionId: data.sectionId,
        deletedAt: null,
      },
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    // Set the new sortOrder to be the next number
    const nextSortOrder = (lastSection?.sortOrder ?? -1) + 1;

    return await prisma.unit.create({
      data: {
        ...omit(data, ["id"]),
        createdBy: "1",
        sortOrder: nextSortOrder,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updateUnit = async (id: string, data: UnitSaveFields) => {
  try {
    return prisma.unit.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: "1",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updatUnitOrder = async (
  data: Array<{ id: string; sortOrder: number }>
) => {
  try {
    // Use a transaction to update all questions at once
    const updatePromises = data.map(({ id, sortOrder }) =>
      prisma.unit.update({
        where: { id },
        data: {
          sortOrder,
          updatedAt: new Date(),
          updatedBy: "1",
        },
      })
    );

    // Execute all updates in parallel
    return await Promise.all(updatePromises);
  } catch (error) {
    const message = handleReturnError(error);
    throw new Error(message);
  }
};

export const deleteUnit = async (id: string) => {
  try {
    return prisma.unit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: "1",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const restoreunit = async (id: string) => {
  try {
    return prisma.unit.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        updatedBy: "1",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};