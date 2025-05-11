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

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL
- **AI**: OpenAI/Groq APIs for document processing and chat

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

See the deployment documentation for detailed instructions on deploying the application to production environments.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- OpenAI API key

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

3. Create a `.env.local` file in the frontend directory with your Clerk and Convex credentials:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

4. Set up the backend
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory with your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key
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
python main.py
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

- OpenAI for providing the AI language model
- shadcn/ui for beautiful UI components
- Clerk for authentication services