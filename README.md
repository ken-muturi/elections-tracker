 Event Registration System

A professional event registration system built with Next.js 15, Prisma, PostgreSQL, ChakraUI, and Formik with Yup validation.

## Features

- Complete event registration with passport information
- Professional form validation using Yup
- PostgreSQL database with Prisma ORM
- Modern UI with ChakraUI
- File upload support for passport photos
- Event management system
- Registration status tracking

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update the DATABASE_URL with your PostgreSQL connection string.

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Database Schema

The system includes two main models:

### Event
- Basic event information (title, date, location, capacity, etc.)
- Linked to registrations

### Registration
- Complete participant information including passport details
- Professional and contact information
- Dietary requirements
- File upload for passport photos
- Status tracking (PENDING, CONFIRMED, CANCELLED)

## Form Validation

All forms use Yup validation schemas with comprehensive validation rules:
- Required field validation
- Email format validation
- Phone number format validation
- Passport expiry date validation
- Duplicate email/passport prevention

## Technologies Used

- **Next.js 15** - React framework with App Router
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **ChakraUI** - Component library
- **Formik** - Form management
- **Yup** - Form validation
- **TypeScript** - Type safety