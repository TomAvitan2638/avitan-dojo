/** Narrow check for typical server-action success payloads (create/update/delete). */
export function isLikelyDbMutationSuccess(result: unknown): boolean {
  return (
    result !== null &&
    typeof result === "object" &&
    "success" in result &&
    (result as { success?: unknown }).success === true
  );
}
