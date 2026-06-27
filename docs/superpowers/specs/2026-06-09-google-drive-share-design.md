# Design Spec: Google Drive Style Share Functionality

**Date:** 2026-06-09  
**Author:** Claude Code  
**Status:** Approved  

---

## 1. Overview
The goal is to implement sharing functionality for files and folders that mimics Google Drive. The system must support sharing of:
1. **Local Files and Directories** in the application's database between registered users.
2. **Google Drive Synced Files and Directories** using the Google Drive permissions API.

---

## 2. Database Schema Changes

We will embed sharing information directly inside the existing `File` and `Directory` models.

### 2.1 File Model Update (`server-auth/models/fileModel.js`)
We will add the following properties:
* `sharedWith`: Array of:
  * `userId`: `Schema.Types.ObjectId` (references `User`)
  * `email`: `String` (cached for quick client-side rendering)
  * `role`: `String` (`'viewer'` or `'editor'`, default `'viewer'`)
* `generalAccess`: `String` (`'restricted'` or `'anyone_view'`, default `'restricted'`)
* `allowEditorShare`: `Boolean` (default `true`)
* `allowDownload`: `Boolean` (default `true`)

### 2.2 Directory Model Update (`server-auth/models/directoryModel.js`)
We will add identical fields to support folder-level sharing:
* `sharedWith`: Array of user sharing info.
* `generalAccess`: `String` (`'restricted'` or `'anyone_view'`, default `'restricted'`)
* `allowEditorShare`: `Boolean` (default `true`)

---

## 3. Backend Implementation

### 3.1 Authorization Middleware
We will implement an authorization function/middleware that resolves permissions recursively:
* A user has **read** (viewer) access to a resource if:
  1. They are the owner (`userId === user._id`).
  2. The resource `generalAccess` is `'anyone_view'`.
  3. They are directly listed in the resource's `sharedWith` list as a `'viewer'` or `'editor'`.
  4. Any of the parent directories recursively up to the root folder grants them view/edit access.
* A user has **write** (editor) access to a resource if:
  1. They are the owner.
  2. The resource `generalAccess` is `'anyone_edit'`. (For security, default general access options will map to viewer, but schema allows editor if needed).
  3. They are directly listed in `sharedWith` as an `'editor'`.
  4. Any of the parent directories recursively up to the root folder grants them edit access.

### 3.2 Backend API Routes

#### `GET /user/search?query=...`
* Searches for registered users by matching `email` or `username` against the query string. Excludes the current logged-in user.

#### `GET /file/:id/share` & `GET /directory/:id/share`
* Returns current share state: `{ sharedWith, generalAccess, allowEditorShare, allowDownload, isGoogleFile }`.
* If it is a Google Drive file/directory (has `googleId`), fetches the permissions list from Google Drive.

#### `POST /file/:id/share` & `POST /directory/:id/share`
* Updates share permissions.
* Payload: `{ sharedWith, generalAccess, allowEditorShare, allowDownload }`.
* If it is a Google Drive item:
  * Syncs permissions to Google Drive using `drive.permissions.create` / `delete`.

#### `GET /directory/shared-with-me`
* Returns files and folders directly shared with the user (where user is listed in `sharedWith` list, but not the owner).

---

## 4. Frontend UI Implementation

### 4.1 UI Updates & Navigation
* **Sidebar**: Link `/shared` to display the "Shared with me" section.
* **Router**: Define a route for `/shared` that loads `DirectoryView` in a special "shared" mode.

### 4.2 Share Modal (`ShareDialog.jsx`)
* **Autocomplete input**: Allows entering emails/usernames to add people.
* **Access list**: Lists Owner and guests, with roles dropdown (Viewer, Editor, Remove).
* **General access configuration**: Dropdown to select Restricted vs Anyone with the link.
* **Copy link button**: Generates and copies the absolute item link.
* **Settings sub-modal**: Toggle controls for "Allow editors to share" and "Allow downloads for viewers".

---

## 5. Google Drive API Integration details
* Google Drive permissions map as:
  * `reader` -> `viewer`
  * `writer` -> `editor`
* For general access:
  * "Anyone with the link" sets type to `anyone` and role to `reader`.
  * "Restricted" deletes any `anyone` permissions on the file.
