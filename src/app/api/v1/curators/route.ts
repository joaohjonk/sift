import { db } from "@/lib/db";
import { listCurators } from "@/lib/repo";
import { handler, publicUser } from "@/lib/api";

export const GET = handler(() => ({ curators: listCurators(db()).map(publicUser) }));
