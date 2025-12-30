import { getUserData } from "@/database";

export type UserData = Awaited<ReturnType<typeof getUserData>>;
export type Legion = UserData["legions"][number];
export type User = UserData["user"];
