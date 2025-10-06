# Logistics Delivery Management System

A comprehensive logistics and delivery management platform built with React, TypeScript, and Supabase. This system provides role-based interfaces for customers, delivery riders, and administrators.

## Features

### Customer Portal
- **Book Deliveries**: Create new delivery orders with pickup/dropoff locations
- **Track Orders**: Real-time tracking of delivery status with public tracking links
- **Delivery History**: View complete history of past deliveries
- **Dashboard**: Overview of active and pending deliveries

### Rider Portal
- **Available Deliveries**: Browse and accept pending delivery orders
- **Active Delivery**: Manage current delivery with status updates
- **Delivery History**: Track completed deliveries and earnings
- **Profile Management**: Update profile information and availability status

### Admin Portal
- **User Management**: View and manage all system users
- **Rider Management**: Add, approve, and manage delivery riders
- **Delivery Management**: Monitor all deliveries and assign riders
- **Delivered Orders**: View history and delete completed orders
- **Analytics Dashboard**: Real-time insights on deliveries, revenue, and performance
- **Notifications**: System-wide announcements and alerts

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL database, Authentication, Realtime)
- **Build Tool**: Vite
- **Deployment**: Optimized for Vercel, Netlify, or similar platforms

## Database Schema

The application uses Supabase with the following main tables:
- `profiles`: User profiles with role-based access (customer, rider, admin)
- `riders`: Extended information for delivery riders
- `deliveries`: Delivery orders with tracking and status management
- `delivery_types`: Configurable delivery service types
- `notifications`: System notifications and announcements

All tables are protected with Row Level Security (RLS) policies.

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
All migrations are located in `supabase/migrations/` and should be applied to your Supabase project.

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Build the project:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify
1. Push your code to GitHub
2. Visit [netlify.com](https://netlify.com) and import your repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy

### Environment Variables for Deployment
Make sure to add these environment variables to your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## User Roles

### Customer
- Default role for all new signups
- Can book and track deliveries
- View personal delivery history

### Rider
- Must be approved by admin after signup
- Can accept and complete deliveries
- Track earnings and delivery history

### Admin
- Full system access
- Manage users, riders, and deliveries
- View analytics and system-wide data
- Create notifications

## Default Admin Setup

To create an admin user, use the provided Edge Function:
```bash
# Call the promote-admin function with user email
curl -X POST <your-supabase-url>/functions/v1/promote-admin \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

## Key Features

### Real-time Updates
- Live delivery status updates using Supabase Realtime
- Instant notifications for order updates
- Real-time rider location tracking

### Public Tracking
- Share tracking links with customers
- No login required for tracking deliveries
- Accessible tracking interface

### Mobile Responsive
- Fully responsive design for all screen sizes
- Optimized for mobile, tablet, and desktop
- Touch-friendly interface

### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Secure authentication with Supabase Auth
- Protected API endpoints

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard components
│   ├── customer/       # Customer portal components
│   ├── rider/          # Rider portal components
│   ├── Login.tsx       # Authentication component
│   ├── Notifications.tsx
│   └── PublicTrackOrder.tsx
├── contexts/
│   └── AuthContext.tsx # Authentication context
├── lib/
│   └── supabase.ts     # Supabase client setup
├── App.tsx             # Main application component
└── main.tsx            # Application entry point

supabase/
├── functions/          # Edge Functions
│   ├── promote-admin/
│   └── signup/
└── migrations/         # Database migrations
```

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking

## Support

For issues and questions, please open an issue in the GitHub repository.

## License

MIT License - feel free to use this project for your own purposes.
