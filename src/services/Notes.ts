"use server";
import prisma from "@/db";
import { Note } from "@/components/Notes/type";
import { handleReturnError } from "@/db/error-handling";
import { getCurrentUser } from "./UserSessison";

export const getNotes = async (modelId: string, model: string) => {
  try {
    return await prisma.note.findMany({
      where: {
        modelId,
        model,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            firstname: true,
            othernames: true,
            email: true,
          },
        },
        updater: {
          select: {
            firstname: true,
            othernames: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};
export const getNoteById = async (id: string) => {
  try {
    return await prisma.note.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstname: true,
            othernames: true,
            email: true,
          },
        },
        updater: {
          select: {
            firstname: true,
            othernames: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};
export const createNote = async (data: Note) => {
  try {
    const user = await getCurrentUser();
    return await prisma.note.create({
      data: {
        ...data,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};
export const updateNote = async (id: string, data: Note) => {
  try {
    const user = await getCurrentUser();
    return await prisma.note.update({
      where: { id },
      data: {
        ...data,
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
};
export const deleteNote = async (id: string) => {
  try {
    const user = await getCurrentUser();
    return await prisma.note.update({
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
