import AuthLayout from "@/components/AuthLayout";
import img from "@/assets/login.png";

import AuthForm from "../AuthForm";
function Login() {
  return (
    <AuthLayout img={img}>
      <div>
        <AuthForm />
      </div>
    </AuthLayout>
  );
}

export default Login;
