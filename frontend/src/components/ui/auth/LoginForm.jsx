import React, { useState } from "react";
import InputField from "./InputField";
import Button from "./Button";
import ErrorMessage from "./ErrorMessage";
import LoadingOverlay from "../LoadingOverlay";
import { loginUser } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const validateForm = () => {
    if (!credentials.username) {
      setError("Please enter your email address");
      return false;
    }
    if (!credentials.username.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (credentials.password.length < 6) {
      setError("PIN must be greater that 6 digits");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (validateForm()) {
      setIsLoading(true);
      try {
        const data = await signIn(credentials);
        console.log("data", data);
      } catch (err) {
        setError(err.message); // Show custom error from API
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {isLoading && <LoadingOverlay />}
      <h1 className="text-3xl font-bold text-center mb-4 font-underdog">
        Login to Your Account
      </h1>
      <p className="text-gray-600 text-center mb-8 font-quicksand">welcome</p>
      {error && <ErrorMessage message={error} />}

      <InputField
        type="email"
        placeholder="Email"
        value={credentials.username}
        onChange={(e) =>
          setCredentials({ ...credentials, username: e.target.value })
        }
      />

      <InputField
        type="password"
        placeholder="6 Digit Pin"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({
            ...credentials,
            password: e.target.value,
          })
        }
      />
      <br />
      <Button>Login to Your Account</Button>
    </form>
  );
};

export default LoginForm;
