# Prism Stock - Multi-Tenant SaaS Inventory Management System

## Overview

Prism Stock is a comprehensive, multi-tenant SaaS inventory management system specifically designed for battery and automotive parts businesses. Built with Next.js 15, React 19, and MongoDB, it provides a powerful platform for managing inventory, sales, customers, and warranty tracking across multiple client organizations.

## 🚀 Key Features

### Multi-Tenant Architecture
- **Client Isolation**: Complete data separation between different client organizations
- **Role-Based Access Control**: Hierarchical user roles (Super Admin, Admin, Manager, Sales, Viewer)
- **Client Management**: Super Admin can create and manage multiple client organizations
- **Secure Data Segregation**: Each client operates within their own isolated data environment

### Core Business Modules

#### 📦 Inventory Management
- **Product Catalog**: Comprehensive product management with categories, specifications, and pricing
- **Stock Tracking**: Real-time inventory monitoring with low stock alerts
- **Battery-Specific Features**: Specialized for battery businesses with series, plate, AH specifications
- **Category Management**: Hierarchical product categorization with brand and series organization

#### 💰 Sales & Invoicing
- **Invoice Generation**: Professional invoice creation with customizable templates
- **PDF Download**: Download invoices as professional PDF files
- **WhatsApp Integration**: Send text invoices with live invoice links directly to customer WhatsApp numbers
- **Thermal Printing**: Support for thermal printer invoice printing
- **Sales Tracking**: Comprehensive sales analytics and reporting
- **Customer Management**: Complete customer database with purchase history
- **Payment Processing**: Payment status tracking and pending payment alerts

#### 🔧 Warranty Management
- **Warranty Verification**: Real-time warranty code checking and validation
- **Warranty History**: Complete warranty tracking and history management
- **Customer Support**: Built-in warranty lookup for customer service

#### 📊 Analytics & Reporting
- **Dashboard Analytics**: Real-time business metrics and KPIs
- **Sales Trends**: Visual sales trend analysis with charts
- **Inventory Reports**: Stock levels, turnover rates, and valuation reports
- **Customer Insights**: Customer behavior and purchase patterns

### Advanced Features

#### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Themes**: Professional theme system with Prism Stock branding
- **Loading States**: Consistent loading experiences across all routes
- **Error Boundaries**: Robust error handling with user-friendly error pages

#### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication system
- **Middleware Protection**: Route-level security with automatic redirects
- **Session Management**: Secure session handling with auto-lock functionality
- **Password Protection**: Additional dashboard password layer for enhanced security

#### 🛠 Technical Excellence
- **React 19 Features**: Latest React features including useActionState and useOptimistic
- **TypeScript**: Full TypeScript implementation for type safety
- **MongoDB Integration**: Scalable NoSQL database with multi-tenant support
- **API Routes**: RESTful API architecture with server actions

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15**: App Router with Server Components
- **React 19**: Latest React features and hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management
- **React Toastify**: Notification system

### Backend & Database
- **MongoDB**: Multi-tenant database design
- **NextAuth**: Authentication framework
- **Server Actions**: React 19 server actions
- **API Routes**: RESTful endpoints

### Key Components

#### Multi-Tenant Structure
```
src/
├── app/
│   ├── dashboard/           # Main dashboard routes
│   │   ├── categories/      # Product categories
│   │   ├── products/        # Product management
│   │   ├── customers/       # Customer management
│   │   ├── invoices/        # Invoice generation
│   │   ├── sales/           # Sales tracking
│   │   ├── users/           # User management
│   │   ├── clients/         # Client management (Super Admin)
│   │   └── warranty-check/  # Warranty verification
│   └── api/                 # API endpoints
├── components/              # Reusable UI components
├── interfaces/              # TypeScript interfaces
├── actions/                 # Server actions
├── hooks/                   # Custom React hooks
└── utils/                   # Utility functions
```

#### Data Models
- **Client**: Multi-tenant client organizations
- **User**: Role-based user management with client association
- **Product**: Inventory items with specifications and categories
- **Category**: Product categorization with battery-specific fields
- **Invoice**: Sales transactions and payment tracking
- **Customer**: Customer database with purchase history

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Environment variables configuration

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd prism-stock

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/prism-stock
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 📋 User Roles & Permissions

### Super Admin
- Create and manage client organizations
- System-wide configuration
- User management across all clients

### Admin
- Manage users within their client organization
- Full access to all business modules
- Client configuration settings

### Manager
- Inventory and sales management
- Customer relationship management
- Limited user management

### Sales
- Create invoices and manage sales
- Customer interactions
- Limited inventory access

### Viewer
- Read-only access to reports and analytics
- Dashboard viewing only

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checks
npm run format       # Code formatting
```

### Key Features Implementation

#### Multi-Tenancy
- Client isolation at database level
- Middleware-based client context
- Secure data access patterns

#### Real-time Features
- Live inventory updates
- Real-time dashboard analytics
- Instant warranty verification

#### Performance Optimizations
- Dynamic imports for code splitting
- Optimistic updates with useOptimistic
- Efficient data fetching patterns

## 🎯 Business Use Cases

### Battery Retailers & Distributors
- **Battery Inventory Management**: Comprehensive battery catalog with specifications (AH, plate, series)
- **Warranty Tracking & Verification**: Real-time warranty code validation and history management
- **Customer Purchase History**: Complete battery purchase tracking for warranty claims
- **Multi-Location Inventory**: Centralized battery stock management across multiple stores
- **Seasonal Demand Planning**: Battery sales analytics for seasonal business cycles

### Automotive Parts Stores
- **Multi-Category Inventory**: Parts categorization by vehicle make, model, and year
- **Sales Analytics**: Parts sales trends and customer vehicle patterns
- **Customer Relationship Management**: Vehicle-specific purchase histories
- **Supplier Management**: Parts procurement and vendor relationship tracking
- **Cross-Selling Opportunities**: Related parts recommendations based on purchase patterns

### Electronics & Hardware Retailers
- **Component Inventory**: Electronic components with specifications and compatibility data
- **Serial Number Tracking**: Individual item tracking for high-value electronics
- **Supplier Chain Management**: Multiple supplier relationships and pricing tiers
- **Technical Specifications**: Detailed product specs for customer inquiries
- **Return & Exchange Management**: Product return tracking and analysis

### Industrial Equipment Suppliers
- **Heavy Equipment Parts**: Large-scale inventory with specialized tracking
- **Maintenance Contracts**: Service contract management and scheduling
- **B2B Customer Management**: Industrial client relationship tracking
- **Equipment History**: Complete maintenance and parts replacement records
- **Fleet Management**: Multiple customer equipment inventory tracking

### Medical & Laboratory Supplies
- **Regulatory Compliance**: FDA and medical supply tracking requirements
- **Expiration Date Management**: Perishable medical supply inventory tracking
- **Batch Number Tracking**: Complete lot tracking for medical supplies
- **Client Compliance Records**: Medical facility compliance documentation
- **Reorder Automation**: Automated reordering based on usage patterns

### Construction & Building Materials
- **Project-Based Inventory**: Track materials by construction project
- **Supplier Management**: Multiple vendor relationships and pricing
- **Waste & Loss Tracking**: Material waste analysis and optimization
- **Equipment Rental**: Tool and equipment rental management
- **Seasonal Planning**: Construction season inventory optimization

### Agriculture & Farming Supplies
- **Seasonal Inventory**: Seed, fertilizer, and equipment seasonal tracking
- **Crop-Specific Supplies**: Inventory management by crop type and season
- **Equipment Maintenance**: Farm equipment service and parts tracking
- **Supplier Contracts**: Agricultural supplier relationship management
- **Weather-Based Planning**: Inventory planning based on seasonal patterns

### Wholesale Distribution Centers
- **Multi-Channel Distribution**: B2B and B2C inventory management
- **Warehouse Optimization**: Space utilization and picking efficiency
- **Transportation Logistics**: Shipping and delivery tracking
- **Customer Tier Management**: Different pricing and service levels
- **Bulk Inventory Management**: Large-scale inventory optimization

### Retail Chain Management
- **Multi-Store Inventory**: Centralized inventory across multiple locations
- **Transfer Management**: Stock transfers between store locations
- **Regional Pricing**: Location-specific pricing and promotions
- **Staff Management**: Role-based access for different store levels
- **Consolidated Reporting**: Chain-wide analytics and performance metrics

### E-commerce Integration
- **Online Store Sync**: Inventory synchronization with e-commerce platforms
- **Order Fulfillment**: Pick, pack, and ship workflow management
- **Customer Service**: Order tracking and customer inquiry management
- **Returns Processing**: E-commerce return and refund management
- **Multi-Channel Sales**: Integration with multiple online marketplaces

### Service & Repair Shops
- **Parts Inventory**: Repair parts and consumables tracking
- **Service History**: Complete customer service and repair records
- **Technician Management**: Staff scheduling and performance tracking
- **Customer Appointments**: Service booking and scheduling system
- **Warranty Claims**: Manufacturer warranty processing and tracking

### Manufacturing & Production
- **Raw Materials**: Component and raw material inventory tracking
- **Production Planning**: Materials requirement planning (MRP)
- **Quality Control**: Product testing and quality assurance tracking
- **Supply Chain**: Vendor management and procurement optimization
- **Work-in-Progress**: Production stage inventory management

### Specialized Applications
- **Vintage & Classic Car Parts**: Rare parts inventory and sourcing
- **Marine & Boat Supplies**: Watercraft parts and accessories management
- **Motorcycle Parts**: Specialized motorcycle inventory and accessories
- **RV & Camping Supplies**: Recreational vehicle parts and equipment
- **Power Equipment**: Lawn equipment and power tool inventory management

### Custom Solutions
- **White-Label Opportunities**: Reseller and distributor partnerships
- **API Integration**: Custom integrations with existing business systems
- **Custom Reporting**: Business intelligence and custom analytics
- **Mobile Solutions**: Field service and mobile inventory management
- **IoT Integration**: Smart inventory and automated tracking solutions

## 🔒 Security Features

- JWT-based authentication
- Multi-tenant data isolation
- Route protection with middleware
- Session management with auto-lock
- Input validation and sanitization
- Error boundary protection

## 📈 Scalability

- MongoDB horizontal scaling
- Multi-tenant architecture for growth
- Optimized database queries
- Efficient state management
- Code splitting for performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary and confidential to Prism Stock.

## 📞 Support

For technical support and inquiries, please contact the development team.

---

**Prism Stock** - Empowering Multi-Tenant Inventory Management 🚀
