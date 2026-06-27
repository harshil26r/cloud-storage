# Axios Auth Failure Interceptor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Handle profile fetching (and general auth) failures by displaying the API's error message in a toast and navigating the user back to the login page without a full page reload.

**Architecture:** Export the React Router instance from `App.jsx` and import it into the Axios interceptor in `axiosInstance.js`. Configure the interceptor to catch `401 Unauthorized` responses (excluding auth endpoints/pages), display the error toast, and trigger SPA navigation to `/login`. Clean up the buggy hook usage in `userSlice.js`.

**Tech Stack:** React 18, React Router v6, Redux Toolkit, Axios, react-hot-toast.

## Global Constraints

- No hooks at module level (no `useNavigate` calls outside React components).
- Do not trigger full page reloads (`window.location.href`) to preserve Single Page Application (SPA) state and toasts.
- Display the exact error message returned from the API response where possible.

---

### Task 1: Clean Up `userSlice.js`

**Files:**

- Modify: `client/src/store/userSlice.js`

**Interfaces:**

- Consumes: None
- Produces: Cleaner `fetchProfile` thunk that only returns rejected value without trying to run React hooks at the top level.

- [ ] **Step 1: Read the file**

Ensure we have the latest contents of the file. Done in initial exploration, but keep this task verified.

- [ ] **Step 2: Modify `client/src/store/userSlice.js`**

Modify `client/src/store/userSlice.js` to remove the module-level hook imports and invocations.

Remove:

```javascript
import { useNavigate } from "react-router";

const navigate = useNavigate();
```

Modify the `fetchProfile` thunk to:

```javascript
export const fetchProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
```

- [ ] **Step 3: Commit the changes**

```bash
git add client/src/store/userSlice.js
git commit -m "refactor: remove invalid useNavigate call and clean up userSlice"
```

---

### Task 2: Export React Router from `App.jsx`

**Files:**

- Modify: `client/src/App.jsx`

**Interfaces:**

- Consumes: None
- Produces: Exported `router` instance that other modules can import to perform SPA navigation.

- [ ] **Step 1: Modify `client/src/App.jsx`**

Export the `router` variable from `client/src/App.jsx`.

Change:

```javascript
const router = createBrowserRouter([
```

To:

```javascript
export const router = createBrowserRouter([
```

- [ ] **Step 2: Commit the changes**

```bash
git add client/src/App.jsx
git commit -m "feat: export router instance from App.jsx for external navigation"
```

---

### Task 3: Configure Axios response interceptor in `axiosInstance.js`

**Files:**

- Modify: `client/src/api/axiosInstance.js`

**Interfaces:**

- Consumes: `router` from `client/src/App.jsx`, `showErrorToast` from `client/src/utils/toastConfig.js`
- Produces: Configured Axios response interceptor that catches 401 errors, toast, and navigates.

- [ ] **Step 1: Implement Response Interceptor in `client/src/api/axiosInstance.js`**

Add the import for `router` and `showErrorToast`, and configure the response interceptor:

```javascript
import { router } from "../App";
import { showErrorToast } from "../utils/toastConfig";
```

And update the response interceptor:

```javascript
// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes("/user/login") ||
        error.config?.url?.includes("/user/signup");
      const isAuthPage =
        window.location.pathname.includes("/login") ||
        window.location.pathname.includes("/signup");

      if (!isAuthEndpoint && !isAuthPage) {
        // Retrieve error message from response data if available
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Session expired. Please log in again.";
        showErrorToast(errorMessage);
        router.navigate("/login");
      }
    }
    return Promise.reject(error);
  },
);
```
