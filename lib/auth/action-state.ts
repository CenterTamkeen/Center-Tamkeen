export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};
