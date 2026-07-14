export function errorResponse(error: unknown) {
  console.error(error);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error && error.message.trim()
        ? error.message
        : "Unexpected error";

  return Response.json(
    { error: { code: "INTERNAL_ERROR", message, status: 500 } },
    { status: 500 },
  );
}
