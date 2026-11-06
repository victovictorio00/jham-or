import { describe, it, expect } from "vitest";
import { slugify, validationFields } from "../src/lib/field-errors";
import { productSchema, categorySchema } from "../src/lib/validation";
describe("creation validation feedback", () => {
  it("derives safe slugs without changing existing custom slugs", () => {
    expect(slugify("  Sofá & Mesa — Edición Perú  ")).toBe(
      "sofa-mesa-edicion-peru",
    );
    expect(slugify("a".repeat(250))).toHaveLength(200);
    expect(slugify("---")).toBe("");
  });
  it("maps actual schema issues to named Spanish errors", () => {
    const result = categorySchema.safeParse({
      name: "",
      slug: "Nombre Incorrecto",
      description: "",
      image: "",
      active: true,
      position: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = validationFields(result.error.issues);
      expect(fields.name).toBe("Completa nombre.");
      expect(fields.slug).toContain("sin espacios");
      expect(fields.position).toContain("mínimo es 0");
    }
  });
  it("keeps custom validation messages on the relevant field", () => {
    expect(
      validationFields([
        {
          path: ["salePrice"],
          code: "custom",
          message: "La oferta debe ser menor.",
        },
      ]),
    ).toEqual({ salePrice: "La oferta debe ser menor." });
    expect(
      validationFields([
        { path: ["price"], code: "too_small", origin: "number", minimum: 1 },
      ]).price,
    ).toContain("mínimo es 1");
  });
});
