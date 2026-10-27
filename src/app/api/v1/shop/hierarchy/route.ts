import { db } from "@/lib/db";
import { catalogHierarchy } from "@/lib/repo";
import { handler } from "@/lib/api";

export const GET = handler(() => ({ categories: catalogHierarchy(db()) }));
