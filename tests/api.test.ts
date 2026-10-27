import { describe, expect, it } from "vitest";
import { publicUser, signToken, verifyToken } from "@/lib/api";

describe("token da API", () => {
  it("aceita token assinado e recusa adulterado", () => {
    const t = signToken(7);
    expect(verifyToken(t)).toBe(7);
    expect(verifyToken(t.replace(/^7/, "8"))).toBeNull();
    expect(verifyToken("7.x")).toBeNull();
    expect(verifyToken("lixo")).toBeNull();
  });

  it("perfil público não expõe nome legal nem telefone", () => {
    const u = publicUser({ id: 1, name: "A", legal_name: "A B", phone: "11" });
    expect(u).toEqual({ id: 1, name: "A" });
  });
});
