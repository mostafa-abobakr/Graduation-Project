import { createContext, useContext, useState } from "react";

const RegisterContext = createContext();

export  const useRegisterContext = ()=>{
    return useContext(RegisterContext)

}
const saveRegister = (data) => {
  localStorage.setItem("register", JSON.stringify(data));
};
const getPreviousRegister = () => {
  const register = localStorage.getItem("register");
  return register ? JSON.parse(register) : null;
};

export const RegisterProvider= ({children})=>{
    const [formData, setFormData]= useState({
        fullName: getPreviousRegister()?.fullName || "",
        email: getPreviousRegister()?.email || "",
        userPhone: getPreviousRegister()?.userPhone || "",
        password: getPreviousRegister()?.password || "",
        restaurantName: getPreviousRegister()?.restaurantName || "",
        address: getPreviousRegister()?.address || "",
        city: getPreviousRegister()?.city || "",
        restaurantPhone: getPreviousRegister()?.restaurantPhone || "",
    })
    const updateFromData = (newData)=>{
        const updatedData = { ...formData, ...newData };
        setFormData(updatedData);
        saveRegister(updatedData);
    }
    const resetFormData = () => {
        localStorage.removeItem("register");
        setFormData({
            fullName: "",
            email: "",
            userPhone: "",
            password: "",
            restaurantName: "",
            address: "",
            city: "",
            restaurantPhone: "",
        });
    };
    return(
        <RegisterContext.Provider value={{formData,updateFromData,resetFormData}}>
            {children}
        </RegisterContext.Provider>
    )
}