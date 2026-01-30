// src/context/ToastContext.jsx
import { createContext, useContext, useReducer, useCallback } from "react";
import { toastReducer, initialState } from "../reducers/toastReducer";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialState);

  const addToast = useCallback(({ title, description, duration = 3000 }) => {
    const id = Date.now().toString();
    dispatch({
      type: "ADD_TOAST",
      payload: { id, title, description },
    });

    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", payload: id });
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts: state.toasts, addToast, removeToast }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};
