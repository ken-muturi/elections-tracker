/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { SectionSaveFields } from "@/components/Builder/Sections/type";
import prisma from "@/db";
import { handleReturnError } from "@/db/error-handling";
import { omit } from "lodash";
import { getCurrentUser } from "./UserSessison";

export const getSections = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const include = hasChildren
    ? { units: { include: { questions: true } } }
    : {};
  try {
    return await prisma.section.findMany({
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

export const getSectionById = async (id: string) => {
  try {
    return prisma.section.findUnique({
      include: { questionnaire: true, units: true },
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createSection = async (data: SectionSaveFields) => {
  try {
    const user = await getCurrentUser();
    // Get the highest sortOrder for sections with the same questionnaireId
    const lastSection = await prisma.section.findFirst({
      where: {
        questionnaireId: data.questionnaireId,
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

    return await prisma.section.create({
      data: {
        ...omit(data, ["id"]),
        createdBy: user.id,
        sortOrder: nextSortOrder,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updateSection = async (id: string, data: SectionSaveFields) => {
  try {
    const user = await getCurrentUser();
    return prisma.section.update({
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

export const updateSectionOrder = async (
  data: Array<{ id: string; sortOrder: number }>
): Promise<any[]> => {
  try {
    const user = await getCurrentUser();
    // Use a transaction to update all questions at once
    const updatePromises = data.map(({ id, sortOrder }) =>
      prisma.section.update({
        where: { id },
        data: {
          sortOrder,
          updatedAt: new Date(),
          updatedBy: user.id,
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

export const deleteSection = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.section.update({
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

export const restoresection = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.section.update({
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