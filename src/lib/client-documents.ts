import { supabase } from "@/integrations/supabase/client";

export type DocumentSide = "front" | "back" | "legacy";

export interface ClientDocument {
  id: string;
  client_id: string;
  document_type: string;
  document_side: string;
  storage_path: string;
  mime_type: string | null;
  status: string;
  source: string;
  created_at: string;
}

const BUCKET = "ine-documents";

export async function fetchClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const { data, error } = await supabase
    .from("client_documents")
    .select("*")
    .eq("client_id", clientId)
    .neq("status", "replaced")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClientDocument[];
}

/** Short-lived signed URL — INE files are never public. */
export async function getDocumentSignedUrl(storagePath: string, expiresIn = 120): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error || !data) throw error ?? new Error("No se pudo generar el enlace");
  return data.signedUrl;
}

/** Uploads an INE file (image or PDF) privately and registers it, replacing the previous one. */
export async function uploadClientDocument(
  clientId: string,
  file: File,
  side: DocumentSide,
  source: "internal_manual" | "public_self_service" = "internal_manual",
): Promise<void> {
  const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
  const path = `${clientId}/ine-${side}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) throw uploadError;

  await supabase
    .from("client_documents")
    .update({ status: "replaced" })
    .eq("client_id", clientId)
    .eq("document_type", "ine")
    .eq("document_side", side)
    .neq("status", "replaced");

  const { data: userData } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("client_documents").insert({
    client_id: clientId,
    document_type: "ine",
    document_side: side,
    storage_path: path,
    mime_type: file.type || null,
    status: "uploaded",
    source,
    created_by: userData.user?.id ?? null,
  });
  if (insertError) throw insertError;
}
