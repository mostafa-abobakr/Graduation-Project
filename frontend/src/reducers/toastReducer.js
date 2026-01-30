export const toastReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [...state.toasts, action.payload] };
    case "REMOVE_TOAST":
      return {
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };
    default:
      return state;
  }
};
export const initialState = {
  toasts: [],
};
