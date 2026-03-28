import React, { Children, useState } from "react";
import { Input } from "@/components/ui/input";
import { Square } from "lucide-react";
import { useFormik } from "formik";
import { loginValidationSchema } from "@/schemas/auth/validations";
import { useNavigate, useSearchParams } from "react-router-dom";
import SquareAuthPage from "@/pages/pos/SquareAuthPage";
import ToastAuthPage from "@/pages/pos/ToastAuthPage";
import GeideaAuthPage from "@/pages/pos/GeideaAuthPage";
const PosForm = ({ title, bgClass, textClass, icon }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const signinHandler = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      setSearchParams((prev) => {
        prev.set("auth", title)
        return prev
      })



    }, 1000);
  };
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: (values) => {
      signinHandler(values);
    },
  });

  const auth = searchParams.get("auth")
  if (auth) {
    if (auth === "Square") {
      return <SquareAuthPage />
    } else if (auth === "Toast") {
      return <ToastAuthPage />
    } else if (auth === "geidea") {
      return <GeideaAuthPage />
    }
  }
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 h-[100vh]">
      <div className="text-center">
        {icon}
        <h1 className="font-semibold mb-7 text-black">{title} </h1>
      </div>
      <form onSubmit={formik.handleSubmit} className="border-2 border-gray-200 bg-white shadow-md rounded-2xl p-4 w-full max-w-md">
        <h1 className="mb-3 font-semibold text-black">Sign in to {title}</h1>
        <p className="mb-6 text-sm pr-9 text-gray-500">
          Enter Your Credentials to authorize the application
        </p>
        <h4 className="text-black">Email address</h4>


        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@restaurant.com"
          className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus-visible:ring-gray-400"
          {...formik.getFieldProps("email")}
        />
        {formik.touched.email && formik.errors.email && <p className="text-sm font-medium text-red-500 mt-1">{formik.errors.email}</p>}

        <h4 className="mt-2 text-black">Password</h4>


        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter Your Password"
          className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus-visible:ring-gray-400"
          {...formik.getFieldProps("password")}
        />
        {formik.touched.password && formik.errors.password && <p className="text-sm font-medium text-red-500 mt-1">{formik.errors.password}</p>}
        {/* <h1 className={`my-3 ${textClass} `} >Forgot Password ?</h1> */}
        <button type="submit" disabled={loading} className={` ${bgClass} mt-6 text-white w-full rounded-sm py-2 text-sm `}> Sign in</button>
        <hr className="border-gray-200 h-1 my-4" />
        <h2 className="text-center text-black">Dont have an account ? <button type="button" className={`${textClass}`}>Sign up</button></h2>
      </form>
      <h4 className="text-center text-gray-500 mt-4">Privacy Policy · Terms of Service · Help</h4>
    </div>
  );
};

export default PosForm;
