import { useNavigate, useLocation } from "react-router";
import { useSelector } from "react-redux";

const navItems = [
  {
    label: "My Drive",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
    path: "/",
  },
  {
    label: "Shared",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/shared",
  },
  {
    label: "Recent",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 7v5l3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/recent",
  },
  {
    label: "Starred",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/starred",
  },
  {
    label: "Trash",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/trash",
  },
];

export default function Sidebar({ currentDir, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user.user);
  const storageUsed = user?.storageUsed || 0;
  const storageTotal = user?.storageTotal || 500 * 1024 * 1024;

  const getUsedText = (usedBytes) => {
    if (usedBytes < 1024 * 1024) {
      return `${usedBytes.toLocaleString()} Bytes`;
    }
    return `${(usedBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const storageUsedText = getUsedText(storageUsed);
  const storageTotalMB = (storageTotal / (1024 * 1024)).toFixed(0);
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  return (
    <>
      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-gray-600/75 transition-opacity dark:bg-gray-955/80"
            onClick={onClose}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4 dark:bg-gray-900">
            <div className="absolute top-2 right-2">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close menu</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 mt-8">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? !currentDir?.googleId &&
                      !currentDir?.isVirtualSharedRoot &&
                      (location.pathname === "/" ||
                        location.pathname.includes("/directory/"))
                    : item.path === "/shared"
                      ? location.pathname === "/shared" ||
                        !!currentDir?.isVirtualSharedRoot
                      : location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 dark:text-gray-400">
                <span>
                  {storageUsedText} of {storageTotalMB} MB used
                </span>
                <span>{storagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 h-[calc(100vh-3.5rem)] sticky top-14 border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? !currentDir?.googleId &&
                  !currentDir?.isVirtualSharedRoot &&
                  (location.pathname === "/" ||
                    location.pathname.includes("/directory/"))
                : item.path === "/shared"
                  ? location.pathname === "/shared" ||
                    !!currentDir?.isVirtualSharedRoot
                  : location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 dark:text-gray-400">
            <span>
              {storageUsedText} of {storageTotalMB} MB used
            </span>
            <span>{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
