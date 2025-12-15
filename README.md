# Job Tracker

A full-stack web application for tracking and managing job applications. This project helps users organize their job search by storing job details, tracking application statuses, and analyzing job search progress through interactive charts and filters.

## Features

- **User Authentication**: Secure registration and login functionality
- **Job Management**: Create, read, update, and delete job applications
- **Advanced Filtering**: Filter jobs by status, company, and other criteria
- **Dashboard**: View job statistics and search progress with interactive charts
- **File Upload**: Support for uploading documents and files (Cloudinary integration)
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Export to CSV**: Export job data for external analysis

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **File Handling**: Multer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, PostCSS
- **HTTP Client**: Axios
- **Charts**: Chart library for statistics visualization
- **State Management**: Context API

## Project Structure

```
job-tracker/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app configuration
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # Route controllers
│   │   ├── middleware/            # Custom middleware
│   │   ├── models/                # MongoDB models
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   ├── fileUpload/            # File upload configuration
│   │   └── utils/                 # Utility functions
│   ├── .env                       # Environment variables
│   └── package.json               # Backend dependencies
│
└── frontend/
    ├── src/
    │   ├── components/            # React components
    │   ├── pages/                 # Page components
    │   ├── api/                   # API client functions
    │   ├── context/               # Context providers
    │   ├── hooks/                 # Custom React hooks
    │   ├── App.jsx                # Main App component
    │   └── main.jsx               # Entry point
    ├── .env                       # Environment variables
    ├── vite.config.js             # Vite configuration
    ├── tailwind.config.js         # Tailwind CSS configuration
    └── package.json               # Frontend dependencies
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB instance (local or cloud)
- Cloudinary account (for file uploads)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

## Running the Project

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs for the user
- `POST /api/jobs` - Create a new job entry
- `PUT /api/jobs/:id` - Update a job entry
- `DELETE /api/jobs/:id` - Delete a job entry
- `GET /api/jobs/stats` - Get job statistics
- `POST /api/jobs/export` - Export jobs as CSV

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.

## Contact

For questions or support, please open an issue in the repository.
