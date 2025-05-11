# Deployment Guide for Pagey AI

This guide provides instructions for deploying the Pagey AI application to production environments.

## Recommended Deployment Strategy

For this type of application (Next.js frontend + FastAPI backend + PostgreSQL database), we recommend the following deployment strategy:

### Database: Managed PostgreSQL Service

- **Recommendations:**
  - **Neon.tech**: Serverless PostgreSQL (has a free tier)
  - **Supabase**: PostgreSQL with additional features (has a free tier)
  - **Railway**: Easy PostgreSQL deployment
  - **AWS RDS**: For larger-scale applications
  - **DigitalOcean Managed Databases**: Simple setup with good pricing

- **Setup Steps:**
  1. Create an account with your chosen provider
  2. Create a new PostgreSQL database
  3. Save the connection information (host, port, username, password, database name)
  4. Configure your application to use these credentials

### Backend: FastAPI on Cloud Platform

- **Recommendations:**
  - **Railway**: Simple deployment with automatic GitHub integration
  - **Render**: Easy Python deployment with good free tier
  - **Fly.io**: Global edge deployment (has a free tier)
  - **DigitalOcean App Platform**: Managed deployment platform
  - **Heroku**: Classic PaaS option

- **Setup Steps for Railway:**
  1. Create a Railway account and connect your GitHub repository
  2. Create a new service from your repository
  3. Set environment variables from your `.env` file
  4. Add a PostgreSQL plugin or connect to your existing database
  5. Configure the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  6. Deploy the service

- **Setup Steps for Render:**
  1. Create a Render account and connect your GitHub repository
  2. Create a new Web Service
  3. Select Python runtime
  4. Set the build command: `pip install -r requirements.txt`
  5. Set the start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
  6. Add environment variables from your `.env` file
  7. Deploy the service

### Frontend: Next.js on Vercel or Similar

- **Recommendations:**
  - **Vercel**: Optimized for Next.js (recommended)
  - **Netlify**: Good alternative with similar features
  - **Cloudflare Pages**: Fast global CDN

- **Setup Steps for Vercel:**
  1. Create a Vercel account and connect your GitHub repository
  2. Import your repository and select the frontend directory
  3. Configure build settings (if not automatically detected):
     - Framework preset: Next.js
     - Build command: `npm run build`
     - Output directory: `.next`
  4. Add environment variables:
     - `NEXT_PUBLIC_API_URL`: URL of your deployed backend API
  5. Deploy the frontend

## Production Configuration

### Environment Variables

Make sure to set these environment variables in your production environment:

**Backend Environment Variables:**
- Database connection information
- API keys (OpenAI, Groq, etc.)
- Set `API_HOST=0.0.0.0` and `API_PORT=$PORT` (or as required by your hosting platform)
- Set proper `CORS_ORIGINS` to include your frontend domain
- Strong `SECRET_KEY` and `JWT_SECRET` for security

**Frontend Environment Variables:**
- `NEXT_PUBLIC_API_URL`: URL of your deployed backend

### Database Migrations

Run migrations before starting the application:

```bash
cd backend
python run_migrations.py
```

Many platforms allow you to add this to the build script.

### CORS Configuration

Update the CORS settings in the backend to allow requests from your frontend domain:

```python
# In backend/app/core/config.py
CORS_ORIGINS: List[str] = ["https://your-frontend-domain.com"]
```

## Domain Setup

For a professional setup, configure custom domains for both your frontend and backend:

1. Purchase a domain name (e.g., pagey-ai.com)
2. Configure DNS settings:
   - Frontend: `www.pagey-ai.com` or `pagey-ai.com`
   - Backend API: `api.pagey-ai.com`
3. Add SSL certificates (often handled automatically by the hosting platforms)

## Monitoring and Logging

Consider adding:
- Application monitoring (Sentry, New Relic, etc.)
- Logging services (Logtail, Papertrail, etc.)
- Uptime monitoring (UptimeRobot, Pingdom, etc.)

## CI/CD Pipeline

Set up a CI/CD pipeline with GitHub Actions for automated testing and deployment:

1. Create `.github/workflows/deploy.yml` in your repository
2. Configure tests to run on pull requests
3. Configure automatic deployment on merges to main branch

## Scaling Considerations

As your application grows:
- Consider using a CDN for static assets
- Implement caching strategies
- Monitor database performance and scale as needed
- Implement rate limiting for the API
- Set up database backups 