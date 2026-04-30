import { useState, useEffect } from "react";
import { Link } from "react-router";
const SignUp = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [errors, setErrors] = useState({});
  const [data, setData] = useState({
    username: "harshil26r",
    email: "harshil@example.com",
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

    // Clear error when user starts typing again
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = (e) => {
    e.preventDefault();
    let isValid = true;

    const newErrors = {};

    // Username validation
    if (!data.username.trim()) {
      newErrors.username = "Name is required";
      isValid = false;
    } else if (data.username.trim().length < 5) {
      newErrors.username = "Name is minimum 4 charecter";
      isValid = false;
    }

    // Email validation
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

    // Password validation
    if (!data.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (data.password.trim().length < 8) {
      newErrors.password = "Passsword is minimum 8 charecter";
      isValid = false;
    }
    // Password validation
    if (!data.cPassword.trim()) {
      newErrors.cPassword = "Confirm Password is required";
      isValid = false;
    } else if (data.cPassword.trim() !== data.password) {
      newErrors.cPassword = "Confirm Password must br same as Password";
      isValid = false;
    }
    if (isValid) {
      handleSubmit();
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    }
  };
  const handleSubmit = async () => {
    const res = await fetch(`${BASE_URL}auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
        isSubscribe: data.isSubscribe,
        role: data.role,
      }),
    });

    const response = await res.json();
    console.log(response);
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
          <div className="font-normal text-3xl mb-6">Register</div>
          <form className="space-y-6" onSubmit={validateForm} method="POST">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6 text-gray-900"
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
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                />
              </div>
              {errors.username && (
                <span className="text-red-600">{errors.username}</span>
              )}
            </div>
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
                  type="text"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
              {errors.email && (
                <span className="text-red-600">{errors.email}</span>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
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
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
              {errors.password && (
                <span className="text-red-600">{errors.password}</span>
              )}
            </div>
            <div>
              <label
                htmlFor="cpassword"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="cpassword"
                  value={data.cPassword}
                  onChange={onChange}
                  name="cPassword"
                  type="cpassword"
                  autoComplete="password"
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
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
                value={data.isSubscribe}
                onChange={(e) =>
                  setData({ ...data, isSubscribe: e.target.checked })
                }
                className=" w-4 rounded border-gray-100  text-indigo-600 focus:ring-indigo-600"
              />
              <p className="ms-2 text-gray-500">Subscribe to our newsletter</p>
            </div>
            <div className="mt-2 text-gray-500">
              Your personal data will be used to support your experience
              throughout this website, to manage access to your account, and for
              other purposes described in our{" "}
              <Link
                href="forgot"
                className=" underline text-blue-600 hover:text-blue-500"
              >
                privacy policy.
              </Link>
              <link rel="stylesheet" href="#" />
            </div>

            <button
              type="submit"
              className="flex justify-center rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Register
            </button>
            <div className="mt-4 text-center text-gray-500">
              Alredy have an account?{" "}
              <Link
                to="/login"
                className=" underline text-blue-600 hover:text-blue-500"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUp;
