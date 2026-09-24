import { z } from "zod";

// Validación de credenciales. El SERVIDOR es la autoridad — el cliente reusa
// estos schemas solo para feedback temprano, nunca para confiar.
export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
});
export type Credentials = z.infer<typeof credentialsSchema>;

// Lo que la API devuelve del usuario actual. NUNCA incluye passwordHash.
export interface PublicUser {
  id: string;
  email: string;
}
