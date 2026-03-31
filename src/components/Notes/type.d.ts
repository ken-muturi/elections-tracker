export type Note = {
  id?: string;
  parentId?: string;
  modelId: string;
  model: string;
  note: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type NoteWithRelation = Prisma.NoteGetPayload<{
  include: {
    creator: {
      firstname: true;
      othernames: true;
      email: true;
    };
    updater: {
      firstname: true;
      othernames: true;
      email: true;
    };
  };
}>;