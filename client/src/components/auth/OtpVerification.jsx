import { useState } from "react";
import { showErrorToast } from "../../utils/toastConfig";

const OtpVerification = ({ email, onVerify, onBack, onResend }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      showErrorToast("Please enter OTP");
      return;
    }

    setLoading(true);
    try {
      await onVerify(otp);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onResend();
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="font-normal text-3xl mb-6 dark:text-gray-100">Verify Email</div>
      <p className="text-gray-600 mb-6 dark:text-gray-400">
        We have sent an OTP to <strong>{email}</strong>. Please enter it below.
      </p>
      <form className="space-y-6" onSubmit={handleVerifyOtp} method="POST">
        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            OTP Code <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              name="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 text-center text-2xl tracking-widest dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex justify-center rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="flex justify-center rounded-md bg-gray-300 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-400 w-full dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
        >
          Back
        </button>

        <div className="mt-4 text-center text-gray-500 text-sm dark:text-gray-400">
          <p>Didn't receive the OTP?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="text-blue-600 hover:text-blue-500 underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed dark:text-blue-400 dark:hover:text-blue-300"
          >
            Resend OTP
          </button>
        </div>
      </form>
    </>
  );
};

export default OtpVerification;
