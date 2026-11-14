import { useCallback, useState } from "react";

import { ApiClientError } from "../api/client";

export interface ErrorState {
  key: string;
  params: Record<string, string>;
}

export function useApiError() {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const captureError = useCallback((err: unknown) => {
    if (err instanceof ApiClientError) {
      setErrorState({ key: err.errorKey, params: err.params });
    } else {
      setErrorState({ key: "errors.unknown_error", params: {} });
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  return { errorState, captureError, clearError };
}
