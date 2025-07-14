# Food Donation Platform

## Overview
This project is a full-stack web platform designed to connect food donors with NGOs to help reduce food waste and fight hunger. The platform allows individuals, restaurants, and organizations to donate surplus food, while NGOs can register, manage campaigns, and schedule pickups. The system provides analytics, user authentication, and a modern, user-friendly interface.

## Features
- User registration and authentication (donors & NGOs)
- NGO registration and verification
- Food donation requests and management
- Campaign creation and management by NGOs
- Pickup slot scheduling for NGOs
- Search for NGOs and campaigns
- Analytics dashboard for impact tracking
- Notification system for users
- Responsive frontend with modern UI

## Directory Structure
```
├── backend/                # Express.js backend API
│   ├── models/             # Mongoose models (User, NGO, Donation, Campaign, etc.)
│   ├── routes/             # API route handlers (auth, ngos, donations, campaigns, etc.)
│   ├── middleware/         # Authentication and other middleware
│   ├── server.js           # Backend entry point
│   └── package.json        # Backend dependencies and scripts
├── frontend/               # Frontend code (HTML, JS, CSS)
│   └── src/                # Main frontend scripts
├── index.html, v1.html, v2.html, ... # Main HTML pages
├── script.js               # Main JS for UI interactions
├── package.json            # (If using a monorepo setup)
└── README.md               # Project documentation
```

## Backend Setup
1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Create a `.env` file in the `backend/` directory:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000 # or any port you prefer
   ```
3. **Start the backend server:**
   ```bash
   npm run dev   # For development with nodemon
   # or
   npm start     # For production
   ```

## Frontend Setup
The frontend consists of static HTML, CSS, and JS files. You can open `index.html` or `v1.html` directly in your browser, or serve them using a static server.

- If you want to use the authentication and donation features, make sure the backend is running and accessible (default: `http://localhost:5000`).
- Update API URLs in frontend scripts if your backend runs on a different port or domain.

## Environment Variables
The backend requires the following environment variables:
- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – Secret key for JWT authentication
- `PORT` – (Optional) Port for the backend server (default: 3000 or 5000)

## API Endpoints (Backend)
- `POST   /api/auth/register` – Register a new user
- `POST   /api/auth/login` – User login
- `GET    /api/ngos` – List all verified NGOs
- `POST   /api/ngos/register` – Register a new NGO (authenticated)
- `GET    /api/campaigns` – List all active campaigns
- `POST   /api/campaigns` – Create a new campaign (NGO only)
- `POST   /api/donations` – Create a new donation (donor only)
- `GET    /api/analytics/overview` – Platform statistics
- `GET    /api/pickups/slots` – Get available pickup slots
- `POST   /api/pickups/slots` – Create pickup slots (NGO only)
- `GET    /api/notifications` – Get user notifications (authenticated)

## Technologies Used
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Authentication:** JWT
- **Other:** CORS, dotenv, bcryptjs

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is open source and available under the [MIT License](LICENSE). 
