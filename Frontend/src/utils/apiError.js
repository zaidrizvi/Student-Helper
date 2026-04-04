export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function normalizeApiError(error, fallback = "Something went wrong.") {
  const normalized = new Error(getApiErrorMessage(error, fallback));
  normalized.status = error?.response?.status;
  normalized.details = error?.response?.data?.details;
  return normalized;
}
