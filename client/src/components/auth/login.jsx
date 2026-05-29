import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import { login, sendOtp, verifyOtp } from "../../api";
import OtpVerification from "./OtpVerification";

const Login = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials"); // "credentials" or "otp"
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
        // Send OTP for second factor verification
        await sendOtp(data.email);
        showSuccessToast("OTP sent to your email");
        setStep("otp");
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
      await verifyOtp(data.email, otpCode);
      showSuccessToast("Login successful");
      setTimeout(() => {
        navigate("/");
      }, 500);
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
      throw error;
    }
  };
  return (
    <>
      <div className="flex min-h-screen justify-center items-center flex-col w-full px-3  mb-5 lg:px-8">
        <div className="sm:mx-auto sm:max-w-sm flex">
          <h2 className="mt-2 text-center text-3xl font-semibold leading-9 tracking-tight text-gray-800">
            Cloud Storage
          </h2>
        </div>

        <div className="mt-16 border-2  py-10 px-10 rounded sm:mx-auto  md:w-1/2 sm:w-full ">
          {step === "credentials" ? (
            <>
              <div className="font-normal text-3xl mb-6">Login</div>
              <form className="space-y-6" onSubmit={handleSubmit} method="POST">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
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
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium leading-6 text-gray-900"
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
                      className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 flex justify-center rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500  focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {loading ? "Sending OTP..." : "Login"}
                  </button>
                  <div className="mt-4 text-center text-gray-500">
                    Not a registered User?{" "}
                    <Link
                      to="/signup"
                      className=" underline text-blue-600 hover:text-blue-500"
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
