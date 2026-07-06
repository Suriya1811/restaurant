# Deployment Guide

## Problem
Your frontend is deployed on Vercel, but your backend is not deployed yet. That's why you're getting 404 errors when trying to create table types.

## Solution: Deploy Backend to Render.com (Free)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository (hotelpostool)
3. Configure:
   - **Name**: `hotelpostool-api` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Branch**: `main`

### Step 3: Set Environment Variables
In Render dashboard, go to your service settings → "Environment"
Add these variables:
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/pos
JWT_SECRET = your_secure_secret_key_here
NODE_ENV = production
FRONTEND_URL = https://hotelpostool.vercel.app
```

⚠️ **Get these from your MongoDB Atlas cluster and create a strong JWT_SECRET**

### Step 4: Deploy
- Click "Deploy"
- Wait for deployment to complete (takes 2-3 minutes)
- Copy your service URL (e.g., `https://hotelpostool-api.onrender.com`)

### Step 5: Update Frontend
1. Go back to the hotelpostool project
2. Edit `frontend/.env.production`:
   ```
   VITE_API_URL=https://hotelpostool-api.onrender.com/api
   ```
3. Commit and push to GitHub
4. Vercel will auto-redeploy

### For Vercel Frontend:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Environment variables: (already set if needed)
   - VITE_API_URL=https://your-backend-url.onrender.com/api

---

## Quick Checklist
- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Backend deployed to Render
- [ ] Environment variables set on Render
- [ ] Backend URL copied
- [ ] Frontend `.env.production` updated with backend URL
- [ ] Frontend redeployed on Vercel
- [ ] Test login: should now work!

## Testing
1. Go to https://hotelpostool.vercel.app
2. Log in with your credentials
3. Try creating a Table Type - should work now!

## Troubleshooting
If still getting 401 errors:
- Check Render logs for JWT_SECRET errors
- Ensure MONGODB_URI is correct
- Clear browser cache and cookies
- Check that token is being sent in requests (use browser DevTools → Network tab)
