# Pagey AI Backend

This is the backend for Pagey AI, a PDF chat application that allows users to upload PDFs and chat with an AI about the content.

## Features

- RESTful API built with FastAPI
- PostgreSQL database integration
- PDF text extraction and processing
- AI-powered chat with document reference
- Authentication system
- File upload and management

## Project Structure

```
backend/
├── app/                  # Main application
│   ├── api/              # API endpoints
│   │   ├── routes/       # Route definitions
│   │   ├── dependencies/ # API dependencies
│   │   └── middleware/   # API middleware
│   ├── core/             # Core application components
│   │   ├── config.py     # Application configuration
│   │   ├── security.py   # Security utilities
│   │   └── events.py     # Event handlers
│   ├── db/               # Database
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── session.py    # Database session
│   │   └── repositories/ # Database repositories
│   ├── schemas/          # Pydantic models
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── alembic/              # Database migrations
├── uploads/              # File uploads directory
├── main.py               # Application entry point
├── requirements.txt      # Project dependencies
├── env.example           # Environment variables example
└── README.md             # Project documentation
```

## Getting Started

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `env.example` to `.env` and update the values
6. Initialize the database: `alembic upgrade head`
7. Run the application: `uvicorn main:app --reload`

## API Documentation

When the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 