import { Prisma } from "@prisma/client";

export type TabWithRelations = Prisma.TabGetPayload<{
  include: { module: true }
}>;

export type TabDetail = {
  id: string
  title: string,
  module: string,
  moduleId: string,
  description: string,
}
export type TabForm = {
  id?: string,
  title: string,
  moduleId: string,
  description: string,
}