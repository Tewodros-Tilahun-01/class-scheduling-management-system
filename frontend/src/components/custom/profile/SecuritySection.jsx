import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../ui/Card2";
import Button from "../../ui/Button2";
import Input from "../../ui/Input2";
import Badge from "../../ui/Badge";
import { Eye, EyeOff, Lock, Key, Shield } from "lucide-react";
import { changeUserPassword } from "@/services/UserService";
import ErrorMessage from "@/components/ui/auth/ErrorMessage";
import { useAuth } from "@/context/AuthContext";

const SecuritySection = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [password, setPassword] = React.useState({
    current: "",
    new: "",
    confirm: "",
    id: user.id,
  });
  const [error, setError] = React.useState("");

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "current":
        setShowPassword(!showPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.new.length < 6) {
      setError("The password is too short. Make it > 6");
      return;
    }
    setLoading(true);
    setError("");

    changeUserPassword(password)
      .then((response) => {
        setPassword({ current: "", new: "", confirm: "" });
      })
      .catch((error) => {
        setError(error.response.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorMessage message={error} />}

          <form className="space-y-4">
            <Input
              label="Current Password"
              type={showPassword ? "text" : "password"}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              onChange={(e) =>
                setPassword({ ...password, current: e.target.value })
              }
              value={password.current}
              placeholder="Enter your current password"
            />

            <Input
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              leftIcon={<Key size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              onChange={(e) =>
                setPassword({ ...password, new: e.target.value })
              }
              value={password.new}
              placeholder="Enter your new password"
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              leftIcon={<Key size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              }
              onChange={(e) =>
                setPassword({ ...password, confirm: e.target.value })
              }
              value={password.confirm}
              placeholder="Confirm your new password"
            />
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button isLoading={loading} onClick={handleSubmit}>
            {loading ? "Updating" : "Update Password"}
          </Button>
        </CardFooter>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <div className="mt-0.5">
              <Shield size={24} className="text-gray-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Enhance your account security
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Two-factor authentication adds an extra layer of security to
                your account. In addition to your password, you'll need to enter
                a code from your phone.
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                Enable 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex space-x-3">
                <div className="mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-500"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    MacBook Pro
                  </h4>
                  <p className="text-xs text-gray-500">
                    New York, USA · Current session
                  </p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex space-x-3">
                <div className="mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-500"
                  >
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12" y2="18" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    iPhone 15
                  </h4>
                  <p className="text-xs text-gray-500">
                    San Francisco, USA · Last active 2 days ago
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Revoke
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" className="text-red-600">
            Sign out of all devices
          </Button>
        </CardFooter>
      </Card> */}
    </div>
  );
};

export default SecuritySection;
