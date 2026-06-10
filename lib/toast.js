import toast from "react-hot-toast";

/**
 * @param {unknown} error
 * @param {string} fallback
 */
export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export const appToast = {
  /** @param {string} message */
  success(message) {
    toast.success(message, { duration: 3000 });
  },

  /** @param {unknown} error @param {string} [fallback] */
  error(error, fallback) {
    toast.error(getErrorMessage(error, fallback), { duration: 4500 });
  },

  /** @param {string} message */
  loading(message) {
    return toast.loading(message);
  },

  dismiss: toast.dismiss,
};
