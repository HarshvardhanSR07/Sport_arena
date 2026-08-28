# IITG Arena Hub - Smart Sports Scheduler

A comprehensive MERN stack application for managing sports facility bookings at IIT Guwahati.

## Features

✅ **Authentication**: IITG email verification
✅ **Custom Scheduling**: Flexible time slots
✅ **Smart Booking**: Conflict detection, one-booking-per-day policy
✅ **Waitlist System**: Up to 5 users with auto-promotion
✅ **Penalty System**: No-show penalties with exemptions
✅ **Weather Integration**: Outdoor sport safety checks
✅ **Challenger Mode**: Matchmaking for finding players
✅ **QR Check-In**: Unique codes for each booking
✅ **Swap System**: Exchange bookings between users
✅ **Analytics**: Weekly traffic patterns and peak hours
✅ **Minimum Participants**: Group sport validation

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- OpenWeatherMap API key (free tier)

### Backend Setup```bash
cd backend
npm install
cp .env.example .env
# Add your MongoDB URI and OpenWeather API key
npm run seed  # Creates sample data
npm run dev
