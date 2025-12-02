# Deployment Guide for Plant Therapy Report Generator

## Current Issue
Your React frontend is deployed on Vercel, but your Python Flask backend is not running. Vercel only hosts frontend applications and cannot run Python servers.

## Solution: Deploy Backend Separately

### Option 1: Deploy Backend to Railway (Recommended)

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Create New Project**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Set Source Directory to `backend`**
7. **Railway will automatically:**
   - Detect it's a Python app
   - Install dependencies from `requirements.txt`
   - Use the `Procfile` to run the app
   - Provide a public URL

### Option 2: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)**
2. **Create New Web Service**
3. **Connect GitHub repository**
4. **Set Source Directory to `backend`**
5. **Configure:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Environment: Python 3

## Update Frontend Configuration

1. **Get your backend deployment URL** (e.g., `https://your-app.railway.app`)
2. **Set environment variable in Vercel:**
   - Go to your Vercel project settings
   - Add environment variable: `REACT_APP_API_URL`
   - Set value to your backend URL

## Environment Variables

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-backend-url.com
```

### Backend (Railway/Render)
```
OPENAI_API_KEY=your_openai_api_key
FLASK_ENV=production
FLASK_DEBUG=0
```

## Testing

1. **Test backend locally:**
   ```bash
   cd backend
   python app.py
   ```

2. **Test frontend locally:**
   ```bash
   npm install
   npm run dev
   ```

3. **Test production:**
   - Frontend: Your Vercel URL
   - Backend: Your Railway/Render URL

## File Structure for Deployment

```
├── frontend/          # Deploy to Vercel
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── backend/           # Deploy to Railway/Render
│   ├── app.py
│   ├── requirements.txt
│   ├── Procfile
│   └── runtime.txt
```

## Troubleshooting

- **CORS issues:** Backend already has CORS configured
- **API calls failing:** Check `REACT_APP_API_URL` environment variable
- **Backend not starting:** Check Railway/Render logs for Python errors
- **Dependencies missing:** Ensure `requirements.txt` is in backend folder
