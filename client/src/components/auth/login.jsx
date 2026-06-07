import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import { login, sendOtp, verifyOtp } from "../../api";
import OtpVerification from "./OtpVerification";
import { GoogleLogin } from "@react-oauth/google";
import { verifyGoogleToken } from "../../api/authAPI";

const Login = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    email: "pipaliyaharshil26@gmail.com",
    password: "12345678",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.email.trim() || !data.password.trim()) {
      showErrorToast("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const { data: loginData, statusText } = await login(
        data.email,
        data.password,
      );

      if (statusText === "OK") {
        try {
          await sendOtp(data.email);
          showSuccessToast("OTP sent to your email");
          setStep("otp");
        } catch (otpError) {
          showErrorToast(otpError.message);
        }
      } else {
        showErrorToast(loginData.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      showErrorToast(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    try {
      const { statusText } = await verifyOtp(data.email, otpCode);
      if (statusText === "OK") {
        showSuccessToast("Login successful");
        setTimeout(() => {
          navigate("/");
        }, 500);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      showErrorToast(error.message || "Invalid OTP");
      throw error;
    }
  };

  const handleResendOtp = async () => {
    try {
      await sendOtp(data.email);
      showSuccessToast("OTP resent successfully");
    } catch (error) {
      console.error("Resend OTP error:", error);
      showErrorToast(error.message || "Failed to resend OTP");
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
          {step === "credentials" ? (
            <>
              <div className="font-normal text-3xl mb-6 flex dark:text-gray-100">
                Login
              </div>
              <form className="space-y-6" onSubmit={handleSubmit} method="POST">
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
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="mt-2">
                    <input
                      id="password"
                      value={data.password}
                      onChange={onChange}
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
                    />
                  </div>

                  <div className="flex justify-center gap-3 mt-6 mx-auto">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex justify-center rounded-md bg-blue-700 px-6 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending OTP..." : "Login"}
                    </button>
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        const tokenId = credentialResponse.credential;
                        try {
                          const { statusText } =
                            await verifyGoogleToken(tokenId);
                          if (statusText === "OK") {
                            showSuccessToast("Google login successful");
                            setTimeout(() => {
                              navigate("/");
                            }, 500);
                          }
                        } catch (error) {
                          console.error("Google login error:", error);
                          showErrorToast(
                            error.message || "Google login failed",
                          );
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
                    Not a registered User?{" "}
                    <Link
                      to="/signup"
                      className="underline text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <>
              <OtpVerification
                email={data.email}
                onVerify={handleVerifyOtp}
                onBack={() => setStep("credentials")}
                onResend={handleResendOtp}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
