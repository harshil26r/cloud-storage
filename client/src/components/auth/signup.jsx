import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import { signupUser, fetchProfile } from "../../store/userSlice";
import { sendOtpAction, verifyOtpAction, verifyGoogleTokenAction } from "../../store/authSlice";
import OtpVerification from "./OtpVerification";
import { GoogleLogin } from "@react-oauth/google";

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({
    username: "harshil26r",
    email: "pipaliyaharshil26@gmail.com",
    password: "12345678",
    cPassword: "12345678",
    isSubscribe: false,
  });

  const onChange = (e) => {
    const { name, value } = e.target;

    setData({
      ...data,
      [name]: value,
    });

    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = (e) => {
    e.preventDefault();
    let isValid = true;

    const newErrors = {};

    if (!data.username.trim()) {
      newErrors.username = "Name is required";
      isValid = false;
    } else if (data.username.trim().length < 5) {
      newErrors.username = "Name is minimum 4 charecter";
      isValid = false;
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        data.email,
      )
    ) {
      newErrors.email = "Invalid email address";
      isValid = false;
    }

    if (!data.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (data.password.trim().length < 8) {
      newErrors.password = "Passsword is minimum 8 charecter";
      isValid = false;
    }
    if (!data.cPassword.trim()) {
      newErrors.cPassword = "Confirm Password is required";
      isValid = false;
    } else if (data.cPassword.trim() !== data.password) {
      newErrors.cPassword = "Confirm Password must br same as Password";
      isValid = false;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return isValid;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!validateForm(e)) {
      return;
    }

    setLoading(true);
    try {
      await dispatch(sendOtpAction(data.email)).unwrap();
      showSuccessToast("OTP sent to your email");
      setStep("otp");
    } catch (error) {
      console.error("Send OTP error:", error);
      showErrorToast(error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    try {
      await dispatch(verifyOtpAction({ email: data.email, otp: otpCode })).unwrap();
      await handleCompleteSignup();
    } catch (error) {
      console.error("OTP/Signup error:", error);
      showErrorToast(error || "Invalid OTP");
    }
  };

  const handleResendOtp = async () => {
    try {
      await dispatch(sendOtpAction(data.email)).unwrap();
      showSuccessToast("OTP resent successfully");
    } catch (error) {
      console.error("Resend OTP error:", error);
      showErrorToast(error || "Failed to resend OTP");
    }
  };

  const handleCompleteSignup = async () => {
    try {
      const result = await dispatch(signupUser({
        username: data.username,
        email: data.email,
        password: data.password,
      })).unwrap();
      showSuccessToast(result.message || "Registration successful");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (error) {
      console.error("Signup error:", error);
      showErrorToast(error || "Signup failed");
    }
  };

  return (
    <>
      <div className="flex min-h-screen justify-center items-center flex-col w-full px-3 mb-5 lg:px-8 bg-white dark:bg-gray-950">
        <div className="sm:mx-auto sm:max-w-sm flex">
          <h2 className="mt-2 text-center text-3xl font-semibold leading-9 tracking-tight text-gray-800 dark:text-gray-100">
            Cloud Storage
          </h2>
        </div>

        <div className="mt-16 border-2 py-10 px-10 rounded sm:mx-auto md:w-1/2 sm:w-full dark:border-gray-700">
          {step === "form" ? (
            <>
              <div className="font-normal text-3xl mb-6 dark:text-gray-100">Register</div>
              <form
                className="space-y-6"
                onSubmit={handleSendOtp}
                method="POST"
              >
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    User name <span className="text-red-500">*</span>
                  </label>

                  <div className="mt-2">
                    <input
                      id="username"
                      value={data.username}
                      onChange={onChange}
                      name="username"
                      type="text"
                      autoComplete="username"
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
                    />
                  </div>
                  {errors.username && (
                    <span className="text-red-600">{errors.username}</span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      value={data.email}
                      onChange={onChange}
                      name="email"
                      type="text"
                      autoComplete="email"
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
                    />
                  </div>
                  {errors.email && (
                    <span className="text-red-600">{errors.email}</span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      id="password"
                      value={data.password}
                      onChange={onChange}
                      name="password"
                      type="password"
                      autoComplete="password"
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
                    />
                  </div>
                  {errors.password && (
                    <span className="text-red-600">{errors.password}</span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="cpassword"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      id="cpassword"
                      value={data.cPassword}
                      onChange={onChange}
                      name="cPassword"
                      type="password"
                      autoComplete="password"
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
                    />
                  </div>
                  {errors.cPassword && (
                    <span className="text-red-600">{errors.cPassword}</span>
                  )}
                </div>

                <div className="flex items-center mt-4">
                  <input
                    id="isSubscribe"
                    name="isSubscribe"
                    type="checkbox"
                    checked={data.isSubscribe}
                    onChange={(e) =>
                      setData({ ...data, isSubscribe: e.target.checked })
                    }
                    className="w-4 rounded border-gray-100 text-indigo-600 focus:ring-indigo-600 dark:border-gray-600"
                  />
                  <p className="ms-2 text-gray-500 dark:text-gray-400">
                    Subscribe to our newsletter
                  </p>
                </div>

                <div className="mt-2 text-gray-500 dark:text-gray-400">
                  Your personal data will be used to support your experience
                  throughout this website, to manage access to your account, and
                  for other purposes described in our{" "}
                  <Link
                    to="/privacy"
                    className="underline text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    privacy policy.
                  </Link>
                </div>

                <div className="flex justify-center gap-3 mt-6 mx-auto">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex justify-center rounded-md bg-blue-700 px-6 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending OTP..." : "Register"}
                  </button>
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      const tokenId = credentialResponse.credential;
                      try {
                        const result = await dispatch(verifyGoogleTokenAction(tokenId));
                        if (!result.error) {
                          showSuccessToast("Google login successful");
                          dispatch(fetchProfile());
                          setTimeout(() => {
                            navigate("/");
                          }, 500);
                        } else {
                          showErrorToast(result.payload || "Google login failed");
                        }
                      } catch (error) {
                        console.error("Google login error:", error);
                        showErrorToast(error.message || "Google login failed");
                      }
                    }}
                    onError={() => {
                      console.log("Login Failed");
                    }}
                    size="large"
                    theme="outline"
                    logo_alignment="center"
                  />
                </div>

                <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="underline text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <OtpVerification
                email={data.email}
                onVerify={handleVerifyOtp}
                onBack={() => setStep("form")}
                onResend={handleResendOtp}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SignUp;
