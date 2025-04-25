# Work Logger Demo Setup Guide

This guide explains how to set up the necessary environment variables and Firebase services for this application.

## Development Requirements

Before you begin, ensure you have the following installed:

*   **Node.js:** Version 20 or higher. It's recommended to use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node.js versions.
*   **npm:** (Node Package Manager) Comes bundled with Node.js. Used for managing project dependencies.
*   **Git:** For cloning the repository (if applicable).

## 1. Environment Variables (`.env` file)

Create a `.env` file in the root directory of the project and populate it with your Firebase project configuration. You can find these values in your Firebase project settings.

```properties
# .env example
GENERATE_SOURCEMAP=false

REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
```

**How to find these values:**

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (or create a new one).
3.  Navigate to **Project settings** (click the gear icon next to "Project Overview").
4.  Under the **General** tab, scroll down to the **Your apps** section.
5.  If you haven't registered a web app yet, click the **Web** icon (`</>`) and follow the instructions.
6.  Once your web app is registered, find the **Firebase SDK snippet** section and select **Config**.
7.  Copy the corresponding values into your `.env` file.

## 2. Firebase Setup

### Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project**.
3.  Follow the on-screen instructions to create a new project. Give it a name (e.g., `workloggerdemo`).
4.  It's recommended to enable Google Analytics for this project, but it's optional for the core functionality.

### Enable Firebase Services

Once your project is created, you need to enable the following services:

1.  **Authentication:**
    *   In the Firebase console, navigate to **Build** > **Authentication**.
    *   Click **Get started**.
    *   Go to the **Sign-in method** tab.
    *   Enable the desired sign-in providers (e.g., **Google**). See Section 3 for Google OAuth setup.
    *   You might also want to enable **Email/Password** if needed.

2.  **Firestore Database:**
    *   Navigate to **Build** > **Firestore Database**.
    *   Click **Create database**.
    *   Choose **Start in test mode** for initial development (remember to secure your rules before production: `allow read, write: if request.auth != null;`).
    *   Select a Cloud Firestore location (choose one close to your users).
    *   Click **Enable**.

3.  **Storage:**
    *   Navigate to **Build** > **Storage**.
    *   Click **Get started**.
    *   Follow the prompts to set up Cloud Storage. Use the default security rules for now (remember to secure them later: `allow read, write: if request.auth != null;`).
    *   Select a Cloud Storage location (usually the same as your Firestore location).

## 3. Google OAuth Setup (for Google Sign-In)

If you want users to sign in with their Google accounts, you need to configure Google Sign-in within Firebase Authentication and potentially configure OAuth consent screen and credentials in Google Cloud Console.

### Firebase Configuration

1.  Go to your project in the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Build** > **Authentication**.
3.  Go to the **Sign-in method** tab.
4.  Click on **Google** in the list of providers.
5.  **Enable** the toggle switch.
6.  Select a **Project support email**.
7.  Click **Save**.

Firebase often handles the necessary Google Cloud OAuth setup automatically when you enable Google Sign-In through the Firebase console. However, if you need more advanced configuration or encounter issues:

### Google Cloud Console Configuration (If Needed)

1.  Go to the [Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials).
2.  Make sure the correct project (the one associated with your Firebase project) is selected in the top navigation bar.
3.  If you see an OAuth 2.0 Client ID automatically created by Firebase (often named "Web client (auto created by Google Service)"), you usually don't need to do anything else here.
4.  **Configure OAuth Consent Screen:**
    *   If not already configured, click on **OAuth consent screen** in the left menu.
    *   Choose **External** (unless all users are within your Google Workspace organization).
    *   Fill in the required information (App name, User support email, Developer contact information).
    *   Click **Save and Continue** through the Scopes and Test Users sections (you can leave these default/blank for now unless needed).
    *   Go back to the dashboard and **Publish** the app (if it's in testing mode).
5.  **Verify Authorized JavaScript origins and Redirect URIs:**
    *   Go back to the **Credentials** page.
    *   Click on the name of the OAuth 2.0 Client ID being used by Firebase.
    *   Ensure that under **Authorized JavaScript origins**, you have `https://YOUR_AUTH_DOMAIN` (replace `YOUR_AUTH_DOMAIN` with the value from your `.env` file). Firebase usually adds this automatically.
    *   Ensure that under **Authorized redirect URIs**, you have `https://YOUR_AUTH_DOMAIN/__/auth/handler`. Firebase usually adds this automatically.

After completing these steps, your application should be ready to use Firebase Authentication (including Google Sign-In), Firestore, and Storage. Remember to install project dependencies (`npm install` or `yarn install`) and start the development server (`npm start` or `yarn start`).
