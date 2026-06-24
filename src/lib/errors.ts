export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public field?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          field: error.field,
          status: error.status,
          requestId,
        },
      },
      { status: error.status },
    );
  }

  console.error(error);
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
        status: 500,
        requestId,
      },
    },
    { status: 500 },
  );
}

export const Errors = {
  invalidCredentials: () =>
    new AppError("AUTH_INVALID_CREDENTIALS", "Invalid email or password", 401),
  forbidden: () =>
    new AppError("PERMISSION_DENIED", "You do not have permission", 403),
  notFound: (entity: string) =>
    new AppError(`${entity.toUpperCase()}_NOT_FOUND`, `${entity} not found`, 404),
  duplicateLead: () =>
    new AppError(
      "LEAD_DUPLICATE",
      "This lead has already been submitted",
      422,
      "email",
    ),
  insufficientFunds: () =>
    new AppError(
      "WALLET_INSUFFICIENT_FUNDS",
      "Please add funds to continue",
      422,
    ),
  budgetExceeded: () =>
    new AppError(
      "CAMPAIGN_BUDGET_EXCEEDED",
      "Campaign paused — budget exhausted",
      422,
    ),
  payoutBelowMinimum: (min: number) =>
    new AppError(
      "PAYOUT_BELOW_MINIMUM",
      `Minimum payout is $${min}`,
      422,
    ),
  duplicatePayout: () =>
    new AppError(
      "PAYOUT_DUPLICATE_REQUEST",
      "A payout request with this key already exists",
      422,
    ),
};
