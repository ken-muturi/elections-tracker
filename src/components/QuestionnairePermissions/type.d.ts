export type PermissionForm = {
  role: string;
  questionnaireId: string;
  users: Array<{ value: string; label?: string }>;
};