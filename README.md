# Pagey AI

A modern web application that allows users to chat with their PDF documents using AI. Upload PDFs and ask questions in natural language to get answers based on the document content, with citation sources linked directly to the relevant parts of the PDF.

## Features

- **Interactive PDF Chat**: Ask questions about your PDFs and receive AI-generated answers
- **Source Citations**: View exactly where in the PDF the answer information came from
- **Multiple PDF Support**: Upload and chat with multiple PDFs in a single conversation
- **Interactive Mascot**: Fun, animated PDF mascot with different moods and animations
- **Responsive UI**: Modern, responsive design with beautiful animations and transitions
- **Dark/Light Mode**: Choose the theme that works best for you
- **File Management**: Organize and manage your uploaded PDFs
- **Subscription Plans**: Free and paid tiers with different feature sets
- **Parallax Effects**: Engaging scroll and mouse-driven parallax effects
- **Mobile-friendly**: Works great on all screen sizes with a responsive sidebar

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Python, FastAPI, LangChain
- **Database**: PostgreSQL
- **AI**: OpenAI API / Groq API for document processing and chat
- **Authentication**: Clerk
- **Deployment**: Vercel (frontend), Render/Railway (backend), Neon/Supabase (database)

## Project Structure

```
pagey-ai/
├── frontend/         # Next.js frontend application
└── backend/          # FastAPI backend application
```

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- PostgreSQL 13+
- OpenAI API key or Groq API key

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

5. Update the `.env` file with your database credentials and API keys

6. Run migrations:
   ```bash
   python run_migrations.py
   ```

7. Start the backend server:
   ```bash
   uvicorn main:app --reload
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

3. Create a `.env.local` file with your API configuration:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Quick Deployment Options

#### Backend & Database (Free Options)

1. **Database: Neon.tech (PostgreSQL)**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Get your connection string from the dashboard

2. **Backend: Render.com**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository
   - Create a new Web Service pointing to the `backend` directory
   - Add your environment variables (including Neon database URL)
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Frontend (Free Option)

1. **Frontend: Vercel**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Set the root directory to `frontend`
   - Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com`
   - Deploy

For more detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Getting Started

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pagey-ai.git
cd pagey-ai
```

2. Set up the frontend
```bash
cd frontend
npm install
```

3. Create a `.env.local` file in the frontend directory with your Clerk credentials:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Set up the backend
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory:
```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pagey_ai
USE_SQLITE=True  # Set to False to use PostgreSQL

# API Keys
OPENAI_API_KEY=your_openai_api_key
# OR
GROQ_API_KEY=your_groq_api_key

# Security
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
```

### Running the Application

1. Start the frontend
```bash
cd frontend
npm run dev
```

2. Start the backend in a different terminal
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
pagey-ai/
├── frontend/               # Next.js frontend
│   ├── app/                # App directory with pages
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout components (navbar, footer)
│   │   ├── landing/        # Landing page components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── chat/           # Chat interface components
│   │   ├── ui/             # Base UI components
│   │   └── shared/         # Shared components
│   ├── lib/                # Utility functions and hooks
│   └── public/             # Static assets
├── backend/                # Python FastAPI backend
│   ├── app/                # Application modules
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── db/             # Database models and session
│   │   └── services/       # Business logic services
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   └── uploads/            # Directory for uploaded PDFs
└── README.md               # Project documentation
```

## Usage

1. Sign up or log in to your account
2. Create a new chat
3. Upload one or more PDF files
4. Start asking questions about your documents
5. View answers with source citations
6. Click on sources to view the relevant part of the document

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI and Groq for providing the AI language models
- shadcn/ui for beautiful UI components
- Clerk for authentication services
- Vercel, Render, and Neon for their generous free hosting tiers