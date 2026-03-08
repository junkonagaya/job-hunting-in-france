

# JobHunt France 🇫🇷 — Job Tracking Dashboard

## Overview
A web app for job seekers (especially foreigners in France) to track applications, measure conversion rates, and prioritize jobs using AI-powered relevance scoring.

## Pages & Features

### 1. Auth (Login/Signup)
- Email/password authentication via Supabase
- User profile with CV/experience upload for AI matching

### 2. Dashboard (Home)
- **Stats cards**: Total saved jobs, applied count, interview count, offers received, conversion rates (applied→interview, interview→offer)
- **Pipeline visualization**: Kanban-style or funnel chart showing job stages
- **Recent activity feed**

### 3. Job List
- Table/card view of all saved jobs with columns:
  - Company name, job title, source (LinkedIn/WTTJ)
  - **AI Relevance Score** (percentage match to your profile)
  - **French level required** (tagged from job description)
  - Date posted, date saved
  - Application status (Saved → Applied → Interview → Offer / Rejected)
- **Sort & filter**: By relevance score, date posted, status, French level
- Priority indicator combining recency + relevance score

### 4. Add Job
- Paste a job URL or manually enter details
- Auto-extract job info via web scraping (Firecrawl)
- AI analyzes job description vs. your profile for relevance score + French level detection

### 5. Profile/Settings
- Upload CV or enter skills/experience summary (used for AI matching)
- Set target job preferences

## Backend (Supabase/Lovable Cloud)
- **Database**: Users, profiles, saved_jobs, job_applications tables
- **AI Edge Function**: Uses Lovable AI to compare CV against job descriptions and return relevance scores + French level detection
- **Scraping Edge Function**: Uses Firecrawl to extract job details from pasted URLs
- **Auth**: Supabase auth with user profiles

## Design
- Clean, modern dashboard design
- Light/dark mode
- Mobile-responsive

