<div align="center">
  <h1>MediCare - Smart Hospital Solution🏥</h1>
</div>

# Live : [(Admin)](https://medicare-admin-qjn1.onrender.com) | [(Client)](https://medicare-frontend-r4fw.onrender.com)

# Description
A scalable healthcare management platform that streamlines appointments, patient workflows, healthcare services, and digital payments within a unified system. Built with role-based access control and modern architecture, it enables efficient healthcare operations through secure and intuitive user experiences.

# Features
## A. Admin Can👨‍💼:
1. **Manage Doctors**: Add, update, view, and remove doctor profiles, including specialties, experience, consultation fees, and availability schedules.
2. **Manage Healthcare Services**: Create, edit, organize, and remove medical services while maintaining service details, pricing, and booking availability.
3. **Appointment & Patient Management**: Monitor all patient appointments, track appointment statuses, manage patient records, and oversee booking activities across the platform.
4. **Doctor Availability Management**: Configure doctor schedules and consultation slots to ensure accurate appointment allocation and resource utilization.
5. **Payment & Billing Monitoring**: Track appointment and service payments, monitor transaction records, and oversee billing-related operations.
6. **Analytics & Dashboard Insights**: Access real-time statistics and operational insights, including appointment trends, doctor performance, service usage, and revenue metrics.

## B. Patient Can🧑‍🤝‍🧑:
1. **Secure Account Management**: Register, log in, and manage personal profile information through a secure authentication system.
2. **Doctor & Service Discovery**: Browse doctors by specialty, view detailed profiles, and explore available healthcare services before booking.
3. **Online Appointment Booking**: Schedule doctor consultations seamlessly by selecting preferred doctors, dates, and available time slots.
4. **Healthcare Service Booking**: Book diagnostic tests, medical services, and healthcare packages directly through the platform.
5. **Secure Online Payments**: Make appointment and service payments securely using Stripe with real-time payment confirmation.
6. **Booking History & Tracking**: Access complete appointment and service booking history while tracking booking statuses in real time.
7. **Appointment Management**: Receive booking confirmations and updates, and reschedule or cancel appointments based on availability and platform policies.

## C. Doctor Can👨‍⚕️:
1. **Secure Authentication & Profile Management**: Access a dedicated doctor portal with secure authentication and manage professional profile information.
2. **Appointment Management**: View assigned appointments, manage schedules, and accept, confirm, reschedule, or cancel patient bookings.
3. **Availability & Slot Configuration**: Configure consultation availability and manage appointment slots to optimize scheduling efficiency.
4. **Patient Information Access**: Review patient details, appointment information, and medical history before consultations.
5. **Appointment Status Updates**: Update appointment progress by marking consultations as completed, canceled, or rescheduled.
6. **Service Booking Management**: Monitor and manage service-related bookings associated with healthcare consultations.
7. **Consultation History Tracking**: Access previous appointment records and consultation history for improved patient care and follow-up management.

# 📸 ScreenShots
**Admin Portal**

AdminHome
<img src="screenshots/Admin Panel.png"/>
DashboardPage
<img src="screenshots/Admin Dashboard.png"/>
DoctorPage
<img src="screenshots/Admin DoctorPage.png"/>
ServicePage
<img src="screenshots/Admin ServicePage.png"/>

**Patient Portal**

PatientHome
<img src="screenshots/Patient Home.png"/>
DoctorProfile
<img src="screenshots/Patient DocProfile.png"/>
AppointmentBooking
<img src="screenshots/Patient BookAppt.png"/>
DoctorLoginPage
<img src="screenshots/Doctor LoginPage.png"/>
DoctorDashboard
<img src="screenshots/Doctor Dashboard.png"/>

# 🛠 Tech Stack

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![MongoDB](https://img.shields.io/badge/mongodb-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

# 📂 Folder Structure

```bash
MediCare/
│
├── admin/                    # Admin Panel (React + Tailwind)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx/
│   │   ├── index.css/
│   │   └── main.jsx
│
├── client/                   # Patient Frontend (React + Tailwind)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── doctor/
│   │   ├── pages/
│   │   ├── App.jsx/
│   │   ├── index.css/
│   │   └── main.jsx
│       
├── server/                   # Backend (Node + Express)
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── screenshots
└── README.md

```

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/arman-ali24/MediCare.git
```

## 2️⃣ Navigate to Project

```bash
cd MediCare
```

# 📦 Install Dependencies

## Admin Panel Setup

```bash
cd admin
npm install
```

## Patient Frontend Setup

```bash
cd client
npm install
```

## Backend Setup

```bash
cd server
npm install
```

# 🔑 Environment Variables

1. Create a `.env` file inside the admin folder and add:

```env
VITE_CLERK_PUBLISHABLE_KEY=paste_your_key

```
2. Create a `.env` file inside the client folder and add:

```env
VITE_CLERK_PUBLISHABLE_KEY=paste_your_key

```
3. Create a `.env` file inside the server folder and add:

```env
CLERK_PUBLISHABLE_KEY=paste_your_key
CLERK_SECRET_KEY=paste_your_key
CLOUDINARY_CLOUD_NAME=enter_your_cloudname
CLOUDINARY_API_KEY=enter_your_apikey
CLOUDINARY_API_SECRET=enter_your_apisecret
JWT_SECRET=enter_jwtsecret
STRIPE_SECRET_KEY=paste_your_key
FRONTEND_URL=enter_your_url

```
4. Add your Backend LocalURL in Both Admin and Client folder

# ▶️ Run Project

## Start Backend Server

```bash
cd server
npm start
```

## Start Frontend

```bash
cd client
npm run dev
```

## Start Admin Panel

```bash
cd admin
npm run dev
```

# 🚀 Future Enhancements

- 🎥 Video Consultation
- 🤖 AI-Based Health Suggestions
- 📧 Email Notifications
- 📊 Admin Analytics Dashboard
- 💊 Prescription Management
- 📱 Mobile App Support

# 🤝 Contributing

Contributions are welcome!

## Steps to Contribute

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Open a Pull Request

# 📄 License

This project is licensed under the MIT License.

# ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub!
