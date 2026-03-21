import React, { useState } from "react";
import RegisterPersonal from "./RegisterPersonal";
import RegisterRestaurant from "./RegisterRestaurant";

const Register = () => {
  const [personalInfo, setPersonalInfo] = useState(null);

  return (
    <>
      {!personalInfo ? (
        <RegisterPersonal setPersonalInfo={setPersonalInfo} />
      ) : (
        <RegisterRestaurant  />
      )}
    </>
  );
};

export default Register;
