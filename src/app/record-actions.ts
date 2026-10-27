"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { decidePin, type Decision } from "@/lib/build";
import { queueAction, undoAction, type ActionKind } from "@/lib/record";
import { requireUser } from "@/lib/session";

// Ações do Record, do Dinheiro e do Sift this post. Nada sai em nome dela sem ela segurar.

export async function holdDealAction(dealId: number, kind: ActionKind, back: string) {
  const user = await requireUser(["creator"], back);
  queueAction(db(), user.id, dealId, kind);
  revalidatePath(back);
}

export async function undoDealAction(actionId: number, back: string): Promise<{ error?: string }> {
  const user = await requireUser(["creator"], back);
  try {
    undoAction(db(), user.id, actionId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não deu para desfazer." };
  }
  revalidatePath(back);
  return {};
}

export async function siftPiece(pinId: number, d: Decision) {
  const user = await requireUser(["creator"], "/build");
  decidePin(db(), user.id, pinId, d);
  revalidatePath("/build");
  revalidatePath(`/shop/${user.username}`);
}
