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
    party: {
      select: {
        id: true;
        name: true;
        abbreviation: true;
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
  roleId?: string;
  nextOfKin?: string;
  nextOfKinContacts?: string;
  partyId?: string;
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
  role: string;
  partyId?: string;
  partyTitle: string;
  nextOfKin?: string;
  nextOfKinContacts?: string;
};