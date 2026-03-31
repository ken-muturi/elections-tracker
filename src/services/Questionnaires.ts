/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import { QuestionnaireForm } from "@/components/Builder/Questionnaires/type";
import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling";
import { getCurrentUser } from "./UserSessison";

export const getQuestionnaires = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const include = hasChildren ? { sections: true } : {};
  try {
    return await prisma.questionnaire.findMany({
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

export const getQuestionnaireById = async (id: string, hasChildren = false) => {
  try {
    const include = hasChildren ? { sections: true } : {};

    return prisma.questionnaire.findUnique({
      include,
      where: { id, deletedAt: null },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const createQuestionnaire = async (data: QuestionnaireForm) => {
  try {
    const user = await getCurrentUser();
    return await prisma.questionnaire.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdBy: user.id,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updateQuestionnaire = async (
  id: string,
  data: QuestionnaireForm
) => {
  try {
    const user = await getCurrentUser();
    return prisma.questionnaire.update({
      where: { id },
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
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

export const deleteQuestionnaire = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.questionnaire.update({
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

export const restorequestionnaire = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return prisma.questionnaire.update({
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