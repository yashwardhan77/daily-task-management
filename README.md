# Vidhya Bharati Sewadham - Daily Task Management Portal

A simple, sweet, mobile-friendly, and responsive daily task logging and attendance monitoring application built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

---

## Key Features

### 👥 Employee Portal
* **Easy ID & Password Login**: Employees log in using their personal ID (e.g., `VB01` to `VB15`) and password (`sewadham123`).
* **Work Status Selector**: Select presence status for the day:
  * **Full Day**: Standard 8 hours.
  * **Half Day**: Custom hours (defaults to 4).
  * **Holiday**: Set hours automatically to 0.
* **Work Description / Leave Reason**: Textarea to list classes taken, administrative work, or leave justifications.
* **Log Submission History**: Real-time card history showing previously logged daily records with colored status badges.

### 🛡️ Admin Portal (Manager Panel)
* **Staff Attendance Grid**: Quick visual board listing all 15 employees and their today's submission status (*Full Day*, *Half Day*, *Holiday*, or *Pending*).
* **Detailed Task Inspector**: Click on any employee card to slide out an overlay drawer presenting their full description, logged hours, and timestamp.
* **Historical Auditing**: Select any calendar date to review historical reports.
* **Excel Export**: Download all historical logs into a beautifully structured Excel sheet (`.xlsx`) with custom columns.

---

## Getting Started

### 1. Run the Application locally
Inside the directory `D:\daily task management\`, open your terminal and run:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Demo Credentials for Testing

### 👥 Employees (15 Staff Members)
* **Employee IDs**: `VB01`, `VB02`, `VB03`, `VB04`, `VB05`, `VB06`, `VB07`, `VB08`, `VB09`, `VB10`, `VB11`, `VB12`, `VB13`, `VB14`, `VB15`
* **Default Password**: `sewadham123`

### 🛡️ Admin/Manager
* **Username**: `admin`
* **Password**: `adminpassword123`

---

## Architecture details
* **Local Persistent Store**: All logs are saved locally in [src/lib/actions/tasks_db.json](file:///D:/daily%20task%20management/src/lib/actions/tasks_db.json). This acts as a persistent database so your submissions will not be lost when you restart the development server.
* **Supabase Ready**: You can easily swap the mock database actions in `src/lib/actions/tasks.ts` to call a Supabase REST client for online cloud storage.
