export function errorResponse(error: unknown) {
  if (error instanceof Error) {
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: error.message, status: 500 } },
      { status: 500 },
    );
  }
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Unexpected error", status: 500 } },
    { status: 500 },
  );
}
