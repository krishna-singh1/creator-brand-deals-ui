import { api, type components, unwrap } from "./api/client";

type FilePurpose = components["schemas"]["FilePurpose"];
type AllowedType = components["schemas"]["PresignUploadRequest"]["contentType"];

const ALLOWED: readonly string[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * Direct-to-storage upload (ADR 0006): ask the API for a presigned PUT URL, send the bytes straight to storage,
 * return the fileId to reference in the next API call.
 */
export async function uploadFile(purpose: FilePurpose, file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Use a JPG, PNG or WebP image (PDF for briefs).");
  }
  const presigned = await unwrap(
    api.POST("/files/presign", {
      body: { purpose, contentType: file.type as AllowedType, sizeBytes: file.size, fileName: file.name },
    }),
  );
  const res = await fetch(presigned.uploadUrl, { method: "PUT", headers: presigned.headers, body: file });
  if (!res.ok) throw new Error(`Upload failed (${res.status}). Please try again.`);
  return presigned.fileId;
}
