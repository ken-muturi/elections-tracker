/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { UserForm } from '@/components/Users/type';
import prisma from '@/db';
import { handleReturnError } from "@/db/error-handling";
import { genSaltSync, hashSync } from "bcryptjs";
import { omit } from "lodash";

export async function getUsers(
  whereClause?: Record<string, any>,
  hasChildren = true
) {
  try {
    const where = whereClause ? whereClause : {};

    const include = hasChildren
      ? {
          role: {
            select: {
              title: true,
            },
          },
        }
      : {};
    return await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...where,
      },
      include: hasChildren ? include : undefined,
      orderBy: {
        firstname: "asc",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
}

export const getUserById = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            title: true,
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

export async function getLoginUser(email: string, hasChildren = false) {
  try {
    const include = hasChildren
      ? {
          role: {
            include: {
              permissions: true,
            },
          },
        }
      : { role: true };
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include,
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
}

export async function createUser(
  data: Omit<UserForm, "id" | "passwordConfirm">
) {
  try {
    const salt = genSaltSync(10);
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "war.child";
    return await prisma.user.create({
      data: {
        ...data,
        roleId: data.roleId || 'cmfb95om00002vimw0z2lg6me',
        password: hashSync(defaultPassword, salt),
        email: data.email.toLowerCase() || "",
        image: data.image || "",
        createdAt: new Date(),
        dateOfBirth: '',
        nationalId:"",
        nextOfKin: "",
        nextOfKinContacts: "",
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
}
export async function updateUser(id: string, data: Partial<UserForm>) {
  try {
    const details: Partial<UserForm> = omit(data, [
      "password",
      "confirmPassword",
    ]);
    if (data.password) {
      const salt = genSaltSync(10);
      details.password = hashSync(data.password!, salt);
    }

    return prisma.user.update({
      where: { id },

      data: { ...details, email: details?.email?.toLowerCase() || "" },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting all users loyalty points totals:", message);
    throw new Error(message);
  }
}

export const deleteUser = async (id: string) => {
  try {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const restoreUser = async (id: string) => {
  try {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error restoring users:', error);
    throw error;
  }
};