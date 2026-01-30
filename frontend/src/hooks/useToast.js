import { useToastContext } from "../context/ToastContext";

export const useToast = () => {
  const { addToast } = useToastContext();
  return addToast;
};
