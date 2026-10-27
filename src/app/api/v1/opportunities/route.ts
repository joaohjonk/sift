import { db } from "@/lib/db";
import { creatorOpportunities } from "@/lib/repo";
import { apiUser, handler } from "@/lib/api";

export const GET = handler((req) => ({ opportunities: creatorOpportunities(db(), apiUser(req, ["creator"]).id) }));
