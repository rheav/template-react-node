# React + Node.js Full Stack Template 🚀

A beginner-friendly full-stack template using React, Node.js, PostgreSQL, and Prisma.

## 📚 Table of Contents
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Common Issues](#common-issues)

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your computer
- Git for version control
- A PostgreSQL database (local or hosted)

### Quick Start
1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd your-project-name
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Set up your environment:
   - Copy `server/.env.example` to `server/.env`
   - Update the database URL and other settings

4. Start development servers:
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev

   # Terminal 2: Start frontend
   cd client
   npm run dev
   ```

## 📁 Project Structure
```
your-project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and API calls
│   │   └── App.tsx       # Main React component
│   └── package.json
├── server/                # Node.js backend
│   ├── prisma/           # Database schema and migrations
│   ├── src/              # Server source code
│   └── package.json
├── .env.example          # Template for environment variables
└── nginx.conf.example    # Template for nginx configuration
```

## 💻 Development

### Frontend (React)
- Built with Vite + React + TypeScript
- Components use modern React practices
- API calls are centralized in `client/src/lib/api.ts`

### Backend (Node.js)
- Express.js for the server
- Prisma for database operations
- TypeScript for type safety

### Environment Variables
Copy `.env.example` to `.env` and update:
```env
# Development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/messagedb?schema=public"
PORT=3000
VITE_API_URL="http://localhost:3000"

# Production (update these values)
DATABASE_URL="your-production-database-url"
VITE_API_URL="https://your-domain.com"
```

## 🗄️ Database Setup

### Local Development
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE messagedb;
   ```
3. Update `.env` with your database URL
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

### Production (VPS)
1. Use the database credentials from your VPS dashboard
2. Update `.env` with the production database URL
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## 🚀 Deployment

### 1. Prepare Your Code
- Make sure all changes are committed
- Push to GitHub
- Update environment variables for production

### 2. VPS Setup
1. Clone your repository
2. Copy configuration files:
   ```bash
   cp .env.example .env
   cp nginx.conf.example /etc/nginx/sites-available/your-site
   ```
3. Update configurations with your values

### 3. Build and Run
```bash
# Build frontend
cd client
npm run build

# Start backend
cd ../server
npm run start
```

## 🔧 Common Issues

### Database Connection
- Check if PostgreSQL is running
- Verify database credentials
- Make sure database exists

### Port Already in Use
- Check if another process is using port 3000 or 5173
- Update PORT in .env if needed

### Deployment Issues
- Check nginx configuration
- Verify environment variables
- Look at server logs

## 🤝 Need Help?
- Check the issues section on GitHub
- Review the error messages
- Consult the documentation of:
  - [Prisma](https://prisma.io/docs)
  - [React](https://react.dev)
  - [Express](https://expressjs.com)

---
Happy coding! 🎉
