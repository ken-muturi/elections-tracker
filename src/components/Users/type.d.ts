export type Period = {
  startDate: string
  endDate: string
}

export type FilterProps = {
  user?: string
} & Period


export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: { select: { title: true } };
    organization: {
      select: {
        id: true;
        title: true;
        type: {
          select: {
            id: true;
            title: true;
          };
        };
      };
    };
  };
}>;

export type UserProps = { users: UserWithRelations[] };

export type UserForm = {
  id: string;
  email: string;
  image?: string;
  firstname: string;
  othernames: string;
  gender: string;
  phone: string;
  alternatePhone?: string;
  roleId?: string;
  password?: string;
  passwordConfirm?: string;
};

export type UserDetail = {
  id: string;
  image: string;
  roleId: number;
  email: string;
  emailVerified?: string;
  fullnames: string;
  firstname: string;
  othernames: string;
  gender: string;
  phone: number;
  alternatePhone: string;
  role: string;
  organizationId?: string;
  organizationTitle: string;
};