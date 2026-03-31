import { Prisma } from "@prisma/client";

export type ModuleWithRelations = Prisma.ModuleGetPayload<{
  include: { tabs: true }
}>;

export type ModuleDetail = {
  id: string
  title: string,
  description: string,
}
export type ModuleForm = {
  id?: string,
  title: string,
  description: string,
}