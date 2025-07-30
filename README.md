# EVAL-AI 🤖

**An AI-Powered Platform for Automated Homework Evaluation and Feedback.**

---

[![Vercel](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-black?style=flat-square&logo=vercel)](https://eval-ai-beta.vercel.app/)
[![Render](https://img.shields.io/badge/Backend-Live%20on%20Render-46E3B7?style=flat-square&logo=render)](https://eval-ai-qett.onrender.com/)

EVAL-AI is a comprehensive web application designed to streamline the educational workflow for teachers and students. It leverages the power of Google's Gemini Pro AI to automate the evaluation of homework submissions, providing instant, detailed feedback based on custom rubrics. This allows teachers to save significant time on grading and focus more on teaching, while students receive immediate, constructive feedback to enhance their learning.

## ✨ Key Features

* **🚀 AI-Powered Evaluation:** Utilizes Google's Gemini Pro to automatically grade submissions based on teacher-defined rubrics.
* **🧑‍🏫 Role-Based Access Control:** Separate, secure dashboards and permissions for Admins, Teachers, and Students.
* **📚 Subject & Assignment Management:** Teachers can create and manage subjects and assignments with detailed descriptions and custom rubrics.
* **✍️ Student Submission Portal:** A simple and intuitive interface for students to upload and submit their assignments.
* **📝 Manual Review & Override:** Teachers can review AI-generated scores and feedback, and have the final say by providing their own scores and comments.
* **📊 Admin Dashboard:** A comprehensive overview of all users, with tools to manage user roles and permissions.

## 📸 Screenshots

### Admin Dashboard
<img width="2832" height="1414" alt="image" src="https://github.com/user-attachments/assets/88167a21-1b1b-4a5b-8120-dbf98a5ced28" />

### Teacher Dashboard
<img width="2876" height="1461" alt="image" src="https://github.com/user-attachments/assets/a1f6380a-a830-46ae-86c2-30173fa5e918" />

### Student Submission
<img width="2842" height="1462" alt="image" src="https://github.com/user-attachments/assets/5486ee13-af3a-4211-97a0-d81f5e900cea" />

## 🛠️ Tech Stack

| Category     | Technology                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![React](https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)                                                                                                                                                               |
| **Backend** | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)                                                                                                                                                                                                                                                                       |
| **Database** | ![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)                                                                                                                                                                                                                                                                                                                                                                                  |
| **AI Model** | ![Google Gemini](https://img.shields.io/badge/-Google_Gemini-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)                                                                                                                                                                                                                                                                                                                                                                   |
| **Deployment**| ![Vercel](https://img.shields.io/badge/-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) ![Render](https://img.shields.io/badge/-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)                                                                                                                                                                                                                                                                                   |

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18 or later)
* npm

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/rmayank-24/EVAL-AI.git](https://github.com/rmayank-24/EVAL-AI.git)
    cd EVAL-AI
    ```

2.  **Set up the Backend:**
    * Navigate to the backend directory:
        ```sh
        cd backend
        ```
    * Install NPM packages:
        ```sh
        npm install
        ```
    * Create a `.env` file in the `backend` directory and add the necessary environment variables. See `.env.example` for details.
        ```
        # .env
        PORT=8000
        FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/your/serviceAccountKey.json
        GEMINI_API_KEY=YOUR_GEMINI_API_KEY
        ```

3.  **Set up the Frontend:**
    * Navigate to the frontend directory from the root folder:
        ```sh
        cd frontend
        ```
    * Install NPM packages:
        ```sh
        npm install
        ```
    * Create a `.env` file in the `frontend` directory and add your Firebase configuration and backend URL. See `.env.example` for details.
        ```
        # .env
        VITE_API_BASE_URL=http://localhost:8000
        VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
        VITE_FIREBASE_AUTH_DOMAIN=...
        VITE_FIREBASE_PROJECT_ID=...
        VITE_FIREBASE_STORAGE_BUCKET=...
        VITE_FIREBASE_MESSAGING_SENDER_ID=...
        VITE_FIREBASE_APP_ID=...
        ```

4.  **Run the application:**
    * Run the backend server (from the `backend` folder):
        ```sh
        npm start
        ```
    * Run the frontend development server (from the `frontend` folder):
        ```sh
        npm run dev
        ```

## 📬 Contact

Mayank Rathi - rathimayank.2005@gmail.com

Project Link: [https://github.com/rmayank-24/EVAL-AI](https://github.com/rmayank-24/EVAL-AI)
