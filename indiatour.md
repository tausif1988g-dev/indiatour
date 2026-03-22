# India Tours & Travels Website (With Admin Panel)

## Project Overview
Build a **static website with dynamic admin panel** for "India Tours & Travels".

The website has 2 main sections:
1. Travel Booking (Train, Flight, Bus, Car + Kolkata Tour Packages)
2. Hajj & Umrah Packages

Admin panel should allow updating packages, pricing, and content without coding.

---

## Tech Stack Suggestion

### Frontend
- HTML5
- CSS3 / Tailwind CSS
- JavaScript (Vanilla or React optional)

### Backend (for Admin Panel)
- Node.js + Express
- Database: MySQL / PostgreSQL
- Authentication: JWT

### Hosting
- Frontend: Netlify / Vercel
- Backend: Railway / Render

---

## Website Structure

### 1. Home Page
- Hero banner
- Quick booking form
- Featured packages
- Call-to-action buttons

---

### 2. Travel Booking Section

#### Services:
- Train Booking
- Flight Booking
- Bus Booking
- Car Rental

#### Features:
- Simple booking form
- Source → Destination
- Date selection
- Passenger details

---

### 3. Kolkata Tour Packages

#### Example Packages:
- 1 Day Kolkata Tour
- 3 Days Heritage Tour
- Sundarbans Tour

#### Package Details:
- Title
- Description
- Price
- Duration
- Images
- Itinerary

---

### 4. Hajj & Umrah Section

#### Packages:
- Economy Package
- Deluxe Package
- Premium Package

#### Details:
- Duration (e.g., 15 days, 21 days)
- Hotel details
- Flights included
- Visa support
- Pricing

---

## Admin Panel Requirements

### Login System
- Admin login (email + password)
- Secure authentication (JWT)

---

### Dashboard Features

#### 1. Manage Packages
- Add new package
- Edit package
- Delete package

Fields:
- Name
- Category (Travel / Hajj / Umrah)
- Price
- Description
- Duration
- Image URL

---

#### 2. Manage Bookings
- View booking requests
- Customer name
- Contact details
- Travel type

---

#### 3. Manage Pricing
- Update package prices
- Seasonal pricing support

---

#### 4. Content Management
- Update homepage content
- Change banners
- Edit text sections

---

## Database Structure

### Users Table
- id
- email
- password

### Packages Table
- id
- name
- category
- description
- price
- duration
- image

### Bookings Table
- id
- name
- phone
- service_type
- details
- created_at

---

## API Endpoints

### Auth
- POST /login

### Packages
- GET /packages
- POST /packages
- PUT /packages/:id
- DELETE /packages/:id

### Bookings
- POST /booking
- GET /booking

---

## UI Design Notes

- Clean travel theme
- Mobile responsive
- Use icons for services
- Highlight Hajj & Umrah section separately

---

## Extra Features (Optional)

- WhatsApp booking button
- Payment integration (Razorpay)
- Email notifications
- PDF itinerary download

---

## Goal

Create a **simple, scalable, and easy-to-manage travel website** where:
- Customers can view & request bookings
- Admin can update everything from dashboard

---

## Instruction for Claude

Generate:
1. Frontend (HTML + CSS + JS)
2. Backend (Node.js + Express)
3. Admin panel UI
4. Database integration
5. API connections

Make the project:
- Clean
- Modular
- Easy to deploy