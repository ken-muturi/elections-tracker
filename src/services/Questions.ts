/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { QuestionFormSaveFields } from "@/components/Builder/Questions/type";
import prisma from "@/db";
import { handleReturnError } from "@/db/error-handling";
import { getCurrentUser } from "./UserSessison";

export const getQuestions = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const include = hasChildren ? { unit: true, answers: true } : {};
  try {
    return await prisma.question.findMany({
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

export const getQuestionById = async (id: string) => {
  try {
    return prisma.question.findUnique({
      include: { unit: true },
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createQuestion = async (data: QuestionFormSaveFields) => {
  try {
    const user = await getCurrentUser();
    // Get the highest sortOrder for questions with the same unitId
    const lastSection = await prisma.question.findFirst({
      where: {
        unitId: data.unitId,
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

    return await prisma.question.create({
      data: {
        ...data,
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

export const updateQuestion = async (
  id: string,
  data: QuestionFormSaveFields
) => {
  try {
    const user = await getCurrentUser();
    return prisma.question.update({
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

export const updateQuestionOrder = async (
  data: Array<{ id: string; sortOrder: number }>
) => {
  const user = await getCurrentUser();
  try {
    // Use a transaction to update all questions at once
    const updatePromises = data.map(({ id, sortOrder }) =>
      prisma.question.update({
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
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const deleteQuestion = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.question.update({
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

export const restoreQuestion = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.question.update({
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