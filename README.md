
# Virtus Vehicle Vision - Rental Management System

This is a comprehensive vehicle rental management system built with Next.js, Firebase, Tailwind CSS, ShadCN UI, and Genkit for AI features.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   **Node.js**: Version 20.x or later.
*   **npm** or **yarn**: A package manager for Node.js.
*   **Firebase Project**: You need an active Firebase project. If you don't have one, create it at the [Firebase Console](https://console.firebase.google.com/).

### 1. Environment Variable Setup

The project requires Firebase credentials to connect to your database, authentication, and storage services.

1.  **Create the environment file:**
    In the root directory of the project, create a new file named `.env.local`.

2.  **Populate the file:**
    Copy the following structure into your `.env.local` file and replace the placeholder values with your **actual Firebase project credentials**.

    ```
    # Firebase Admin SDK (for server-side operations)
    # Get these from your Firebase project settings > Service accounts > Generate new private key
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----\n"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"

    # Firebase Client SDK (for browser-side operations)
    # Get these from your Firebase project settings > General
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_API_KEY="your-web-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-web-app-id"

    # Google AI (for Genkit features)
    # Get this from Google AI Studio or Google Cloud Console
    GEMINI_API_KEY="your-gemini-api-key"
    ```

    **Important:** When you copy the `FIREBASE_PRIVATE_KEY` from the JSON file you downloaded, ensure it is enclosed in double quotes (`"`) and that the newline characters (`\n`) are preserved.

### 2. Install Dependencies

Open your terminal in the project's root directory and run the following command to install all the necessary packages:

```bash
npm install
```

### 3. Running the Development Servers

This project requires two development servers running simultaneously for full functionality:
*   The **Next.js app** for the user interface.
*   The **Genkit server** for the AI features (like Smart Reply).

**Terminal 1: Start the Next.js App**

```bash
npm run dev
```
Your application will be available at `http://localhost:3000`.

**Terminal 2: Start the Genkit Server**

```bash
npm run genkit:watch
```
This server runs in watch mode, so any changes to your AI flows will be automatically reloaded.

### 4. Populate the Database (First Time Setup)

The application includes a seeding mechanism to populate your Firestore database with sample data (vehicles, customers, etc.).

1.  Log into the application with your admin credentials.
2.  Navigate to the **Vehicles** page (`/vehicles`).
3.  If the database is empty, you will see a button labeled **"Populate Database"**. Click it.
4.  The process will take a few seconds. Once complete, the page will refresh to show the newly added vehicles.

Your local development environment is now fully configured and running!
# studio2
