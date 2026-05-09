# MediCare 🏥

A modern full-stack healthcare management platform designed to simplify doctor appointments, patient management, and healthcare services with a seamless and responsive user experience.

---

## 🚀 Features

- 🔐 Secure Authentication & Authorization
- 👨‍⚕️ Doctor & Patient Dashboard
- 📅 Online Appointment Booking
- 🩺 Doctor Profile Management
- 💳 Payment Integration
- 📱 Fully Responsive UI
- ⚡ Fast & Optimized Performance
- 🔄 Real-time Data Handling
- 🌐 RESTful API Architecture

---

# 🛠 Tech Stack

## Frontend
- React.js
- Tailwind CSS
- Axios
- React Router DOM

## Backend
- Node.js
- Express.js

## Database
- MongoDB
- Mongoose

## Authentication & Security
- JWT Authentication
- Bcrypt.js

---

# 📂 Folder Structure

```bash
MediCare/
│
├── frontend/              # React Frontend
├── backend/               # Node.js + Express Backend
│
├── models/                # Database Models
├── routes/                # API Routes
├── controllers/           # Business Logic
├── middleware/            # Custom Middleware
├── config/                # Configuration Files
├── utils/                 # Utility Functions
│
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/arman-ali24/MediCare.git
```

## 2️⃣ Navigate to Project

```bash
cd MediCare
```

---

# 📦 Install Dependencies

## Frontend Setup

```bash
cd frontend
npm install
```

## Backend Setup

```bash
cd backend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend folder and add:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

NODE_ENV=development
```

---

# ▶️ Run Project

## Start Backend Server

```bash
cd backend
npm run dev
```

## Start Frontend

```bash
cd frontend
npm start
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login User |
| GET | `/api/doctors` | Get All Doctors |
| GET | `/api/doctors/:id` | Get Single Doctor |
| POST | `/api/appointments` | Book Appointment |
| GET | `/api/appointments` | Get User Appointments |

---

# 📸 Screenshots

## Homepage

```md
![Homepage](./screenshots/home.png)
```

## Dashboard

```md
![Dashboard](./screenshots/dashboard.png)
```

---

# 🚀 Future Enhancements

- 🎥 Video Consultation
- 🤖 AI-Based Health Suggestions
- 📧 Email Notifications
- 📊 Admin Analytics Dashboard
- 💊 Prescription Management
- 📱 Mobile App Support

---

# 🔒 Security Features

- Password Hashing using Bcrypt
- JWT Authentication
- Protected Routes
- Secure API Handling
- Environment Variable Protection

---

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

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

## Arman Ali

### Connect With Me

- GitHub: https://github.com/arman-ali24
- LinkedIn: https://linkedin.com/in/your-linkedin

---

# ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub!

## Repository Link

https://github.com/arman-ali24/MediCare
