/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { UserForm } from '@/components/Users/type';
import prisma from '@/db';
import { handleReturnError } from "@/db/error-handling";
import { genSaltSync, hashSync } from "bcryptjs";
import { omit } from "lodash";
import { getCurrentUser } from "./UserSessison";

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
          party: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
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
    const include = { role: true };
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
    // const defaultPassword = process.env.DEFAULT_USER_PASSWORD;
    // if (!defaultPassword)
    //   throw new Error("DEFAULT_USER_PASSWORD environment variable is not set.");
    return await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        firstname: data.firstname,
        othernames: data.othernames,
        gender: data.gender,
        phone: data.phone,
        image: data.image || "",
        roleId: data.roleId || "",
        partyId: data.partyId || "",
        password: hashSync(data.password || crypto.randomUUID(), salt),
        dateOfBirth: "",
        nationalId: `UID-${Date.now()}`,
        nextOfKin: data.nextOfKin || "",
        nextOfKinContacts: data.nextOfKinContacts || "",
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
    const currentUser = await getCurrentUser();
    const role = (currentUser.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "super admin")
      throw new Error("Only administrators can update users.");
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
    const currentUser = await getCurrentUser();
    const role = (currentUser.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "super admin")
      throw new Error("Only administrators can delete users.");
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
    const currentUser = await getCurrentUser();
    const role = (currentUser.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "super admin")
      throw new Error("Only administrators can restore users.");
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