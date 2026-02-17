# Subscriptions Tracker

📅 Subscription Tracker

A fullstack subscription management application built with:

Next.js (Frontend)

Express + Prisma (Backend)

PostgreSQL

Docker & Docker Compose

🚀 How To Run This Project
✅ Prerequisites

Make sure you have installed:

Docker Desktop

Git

That’s it.
No need to install Node or PostgreSQL manually.

🐳 Run With Docker (Recommended)

This project is fully containerized.

1️⃣ Clone the Repository
git clone <your-repo-url>
cd subscription-tracker

2️⃣ Start All Services
docker compose up --build

This will start:

PostgreSQL database

Backend API

Frontend application

Wait until you see all services running.

3️⃣ Open the Application

Frontend:

http://localhost:3000

Backend API:

http://localhost:5000

4️⃣ Stop the Application
docker compose down

🧠 What Runs Internally

Docker starts three services:

db → PostgreSQL database

backend → Express server (Port 5000)

frontend → Next.js app (Port 3000)

The backend connects to the database using Docker's internal network.

No manual DB setup required.

🔄 Reset Database (If Needed)

To completely reset the database:

docker compose down -v
docker compose up --build

This removes database volume and starts fresh.

🛠 Development Mode (Optional – Without Docker)

If you prefer running manually:

Backend
cd backend
npm install
npm run dev

Frontend
cd frontend
npm install
npm run dev

Make sure PostgreSQL is running locally.

📌 Notes

No .env configuration required for Docker setup.

Database runs inside Docker container.

All services are connected automatically.

That’s it.
One command → fullstack app running.
