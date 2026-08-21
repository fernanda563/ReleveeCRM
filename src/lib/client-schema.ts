import { z } from "zod";

/** Capitalizes each word (used both while typing and on submit). */
export function capitalizeFirstLetter(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const capitalizeAsYouType = capitalizeFirstLetter;

export function cleanPhoneNumber(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export function lastTenDigits(value: string): string {
  return cleanPhoneNumber(value).slice(-10);
}

export function normalizeEmail(value: string): string {
  return (value || "").trim().toLowerCase();
}

export const CONTACT_SOURCES = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "recomendacion", label: "Recomendación" },
  { value: "tienda_fisica", label: "Tienda física" },
  { value: "google", label: "Google" },
  { value: "otro", label: "Otro" },
] as const;

export const nombreField = z
  .string()
  .min(1, "El nombre es obligatorio")
  .max(100, "El nombre no puede exceder 100 caracteres")
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "El nombre solo puede contener letras")
  .transform(capitalizeFirstLetter);

export const apellidoField = z
  .string()
  .min(1, "El apellido es obligatorio")
  .max(100, "El apellido no puede exceder 100 caracteres")
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "El apellido solo puede contener letras")
  .transform(capitalizeFirstLetter);

export const emailField = z
  .string()
  .min(1, "El correo electrónico es obligatorio")
  .email({ message: "Formato de correo electrónico inválido" })
  .max(255, "El correo no puede exceder 255 caracteres")
  .transform(normalizeEmail);

export const telefonoPrincipalField = z
  .string()
  .min(1, "El teléfono principal es obligatorio")
  .regex(/^\+\d+\d{10}$/, "El teléfono debe tener exactamente 10 dígitos");

export const telefonoAdicionalField = z
  .string()
  .regex(/^(\+\d+\d{10})?$/, "El teléfono debe tener exactamente 10 dígitos")
  .optional()
  .or(z.literal(""));

export const fuenteContactoField = z
  .string()
  .min(1, "Debe seleccionar cómo se enteró de nosotros");

/** Shared base schema used by the internal CRM dialog and the public form. */
export const clientBaseSchema = z.object({
  nombre: nombreField,
  apellido: apellidoField,
  email: emailField,
  telefono_principal: telefonoPrincipalField,
  fuente_contacto: fuenteContactoField,
});

export type ClientBaseValues = z.infer<typeof clientBaseSchema>;
