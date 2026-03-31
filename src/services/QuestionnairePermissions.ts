/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { PermissionForm } from "@/components/QuestionnairePermissions/type";
import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling";
import { getCurrentUser } from "./UserSessison";

export const getQuestionnairePermissions = async (
  whereClause?: Record<string, any>,
  hasChildren = false
) => {
  const where = whereClause ? whereClause : {};
  const includes = {
    user: {
      select: {
        id: true,
        email: true,
        firstname: true,
        othernames: true,
        organizationId: true,
        organization: { select: { id: true, title: true } },
      },
    },
    questionnaire: {
      select: { id: true, title: true, description: true },
    },
  };

  try {
    return await prisma.questionnairePermission.findMany({
      where: { deletedAt: null, ...where },
      include: hasChildren ? includes : {},
    });
  } catch (error) {
    console.error("Error getting questionnairePermission:", error);
    throw error;
  }
};

export const createQuestionnairePermission = async (data: PermissionForm) => {
  try {
    const user = await getCurrentUser();
    return await prisma.questionnairePermission.createMany({
      data: data.users.map((u) => ({
        role: data.role,
        questionnaireId: data.questionnaireId,
        userId: u.value,
        createdBy: user.id,
      })),
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};

export const updateQuestionnairePermission = async (
  id: string,
  data: PermissionForm
) => {
  try {
    return prisma.questionnairePermission.update({
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

export const deleteQuestionnairePermission = async (id: string) => {
  try {
    return prisma.questionnairePermission.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error deleting questionnairePermission:", error);
    throw error;
  }
};

export const restoreQuestionnairePermission = async (id: string) => {
  try {
    return prisma.questionnairePermission.update({
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