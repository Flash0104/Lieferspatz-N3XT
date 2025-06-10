# 🍕 Lieferspatz - Modern Food Delivery Platform

A modern, responsive food delivery application built with Next.js 15, TypeScript, Tailwind CSS, and PostgreSQL. Features a complete multi-user authentication system with three distinct user types and a fully functional cart sidebar.

## 🚀 Features

### 🔐 Authentication System
- **Multi-User Types**: Customer, Restaurant, and Admin authentication
- **Secure Registration**: Password hashing with bcryptjs
- **Session Management**: NextAuth.js with JWT tokens
- **Role-Based Access**: Different dashboards for each user type
- **PostgreSQL Database**: Robust data persistence with Prisma ORM

### 🛒 Cart & Shopping
- **Right-Side Cart**: Sidebar slides in from the RIGHT side (not left)
- **Add/Remove Items**: Full cart management
- **Quantity Controls**: Increment/decrement quantities
- **Real-Time Totals**: Live price calculation
- **Persistent State**: Cart state maintained during session

### 🏢 User Dashboards
- **Customer Dashboard**: Order history, profile management, balance tracking
- **Restaurant Dashboard**: Menu management, order processing, earnings tracking
- **Admin Panel**: User management, restaurant oversight, platform statistics

### 🎨 Modern Design
- **Responsive Layout**: Works on all device sizes
- **Tailwind CSS**: Modern, utility-first styling
- **Clean UI**: Professional interface design
- **Vercel Ready**: Optimized for deployment

## 🛠️ Cart Sidebar Fix

This version specifically addresses the cart sidebar positioning issue:

- ✅ Cart is **hidden by default** on all pages
- ✅ Cart **slides in from the RIGHT side** when cart button is clicked
- ✅ **No conflicting JavaScript** files creating multiple cart elements
- ✅ **Clean CSS transitions** with proper z-index management
- ✅ **Mobile responsive** with proper overflow handling

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Database Setup

1. **Create PostgreSQL Database**
```bash
# Create a new PostgreSQL database
createdb lieferspatz_db
```

2. **Environment Configuration**
```bash
# Copy environment example
cp env.example .env.local

# Edit .env.local with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/lieferspatz_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

3. **Database Migration**
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Deployment on Vercel

1. **Easy Deployment**: This app is optimized for Vercel deployment
2. **Connect Repository**: Link your GitHub repository to Vercel
3. **Auto-Deploy**: Push to main branch for automatic deployment

```bash
# Deploy with Vercel CLI
npx vercel

# Or connect your GitHub repository to Vercel dashboard
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Reusable components
│   │   ├── Header.tsx       # Header with cart button
│   │   └── CartSidebar.tsx  # Cart sidebar (slides from RIGHT)
│   ├── context/
│   │   └── CartContext.tsx  # Global cart state management
│   ├── restaurant/
│   │   └── [id]/
│   │       └── page.tsx     # Restaurant menu page
│   ├── globals.css          # Global styles with cart CSS
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
```

## 🛒 Cart Architecture

### Context-Based State Management
- Uses React Context API for global cart state
- No conflicting JavaScript files
- Clean separation of concerns

### Positioning Logic
```css
.cart-sidebar {
  position: fixed;
  top: 0;
  right: 0;                    /* RIGHT side positioning */
  height: 100vh;
  width: 400px;
  transform: translateX(100%); /* Hidden by default */
  transition: transform 0.3s ease;
}

.cart-sidebar.open {
  transform: translateX(0);    /* Slides in from right */
}
```

### Key Components

1. **CartContext**: Global state management
2. **CartSidebar**: Main cart component (slides from right)
3. **Header**: Contains cart button with item count
4. **Restaurant Pages**: Add items to cart functionality

## 🔧 Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **PostgreSQL**: Robust relational database
- **Prisma ORM**: Type-safe database client
- **NextAuth.js**: Complete authentication solution
- **Tailwind CSS**: Utility-first CSS framework
- **bcryptjs**: Password hashing and validation
- **React Context API**: Client-side state management
- **Vercel**: Deployment platform

## 👥 User Types & Authentication

### 🛍️ Customer Users
- **Registration**: Email, password, name, location
- **Features**: Browse restaurants, place orders, manage cart
- **Dashboard**: Order history, profile settings, balance management
- **Default Balance**: €1000.0 starting credit

### 🏪 Restaurant Users  
- **Registration**: Same as customer + automatic restaurant profile creation
- **Features**: Menu management, order processing, earnings tracking
- **Dashboard**: Restaurant info, menu items, current/completed orders
- **Balance Tracking**: Real-time earnings from orders

### 👑 Admin Users
- **Registration**: Full platform access (restricted registration)
- **Features**: User management, restaurant oversight, platform statistics
- **Dashboard**: System stats, restaurant management, user administration
- **Earnings**: Track platform service fees and total revenue

### 🔐 Authentication Flow
```bash
# Three separate login/register buttons for each user type
1. "Login/Register as Customer" - Shopping experience
2. "Login/Register as Restaurant" - Business management  
3. "Login/Register as Admin" - Platform administration
```

## 🐛 Cart Issue Resolution

This implementation solves the following issues from the original Flask version:

1. **Multiple Script Conflicts**: ❌ Removed conflicting main.js and restaurant.js
2. **Left-side Positioning**: ❌ Fixed cart positioning to slide from RIGHT
3. **Unwanted Visibility**: ❌ Cart is completely hidden by default
4. **Browser Caching**: ❌ Fresh Next.js build eliminates cache issues
5. **Complex CSS Overrides**: ❌ Clean, simple CSS implementation

## 📱 Mobile Responsive

- Cart adapts to mobile screens (max-width: 90vw)
- Touch-friendly controls
- Proper overflow handling
- Escape key support for closing cart

## 🚀 Performance

- Optimized for Vercel deployment
- Fast page loads with Next.js optimizations
- Efficient state management
- Minimal bundle size

## 📝 Next Steps

To extend this application:

1. **Backend Integration**: Connect to a real API for restaurants and orders
2. **Authentication**: Add user login/registration
3. **Payment Processing**: Integrate payment gateway
4. **Real-time Updates**: Add WebSocket support for order tracking
5. **Database**: Add persistent storage for cart and orders

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Built with ❤️ for modern food delivery experiences**
