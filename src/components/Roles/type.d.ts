import { Prisma } from "@prisma/client";


export type Period = {
  startDate: string
  endDate: string
}



export type FilterProps = {
  role?: string
} & Period


export type RoleWithRelations = Prisma.RoleGetPayload<{
  include: { users: { firstname: true, othername: true } }
}>;

export type RoleDetail = {
  id: string
  title: string,
  description: string,
}
export type RoleForm = {
  id?: string,
  title: string,
  description: string,
}