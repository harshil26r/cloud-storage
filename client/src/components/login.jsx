import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

const Login = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const navigate = useNavigate();

  const [data, setData] = useState({
    email: "harshil@example.com",
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

    const res = await fetch(`${BASE_URL}auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
      credentials: "include",
    });

    const response = await res.json();
    console.log(response);
    if (response) {
      navigate("/");
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
                className="mt-4 flex  items-center rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Login
              </button>
              <div className="mt-4 text-center text-gray-500">
                Not a register User?{" "}
                <Link
                  to="/signup"
                  className=" underline text-blue-600 hover:text-blue-500"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
