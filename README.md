# Taska - Premium Business Operating System

[![Taska by Result Seekers](https://taska.ng)](https://taska.ng)

A premium multi-business operating system built for African SMEs and growing teams.

## Features

- **Multi-Business Support** - 26 business types across retail, healthcare, hospitality, logistics, agriculture, services, and light manufacturing
- **POS / Sales** - Fast point-of-sale with multiple payment methods
- **Inventory Management** - Track stock levels, transfers, low-stock alerts, expiry, and batch movement
- **Customers & Suppliers** - Full CRM with credit limits
- **Expenses Tracking** - Record and categorize business expenses
- **Trust Fund** - Customer credit and debt management
- **AI Insights** - Explainable business intelligence with practical next steps
- **Reports** - Sales, inventory, profit/loss, customer, and operational reporting
- **Multi-Branch** - Manage multiple locations
- **Subscription Billing** - Free, Starter, Growth, and Business plans

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + TanStack Query + Zustand
- **Backend**: Laravel + SQLite (local dev) with PostgreSQL-ready multi-tenant API design
- **Auth**: Laravel Sanctum

## Quick Start

### Prerequisites

- Node.js 18+
- PHP 8.2+
- Composer

### Installation

```bash
# Clone the repository
cd Taska

# Backend setup
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### Development

```bash
# Start backend
cd backend
php artisan serve

# Start frontend (new terminal)
cd frontend
npm run dev
```

## Business Types Supported

1. Retail / Shop / Kiosk
2. Supermarket
3. Pharmacy
4. Agro Dealer
5. Restaurant
6. Hotel / Guest House
7. Clinic / Health Facility
8. Laboratory / Diagnostic Centre
9. Logistics Company
10. Delivery Company / Courier
11. NGO Warehouse
12. Distributor / Wholesale
13. Commodity Business
14. Textile / Fashion / Kwari Market
15. Pure Water Factory
16. Livestock Farm
17. Crop Farming / Agribusiness
18. Service Business
19. Mobile Agent / POS Business
20. School / Training Centre
21. Building Materials Business
22. Fuel / Energy Business
23. Beauty / Salon / Barbing
24. Mixed Business
25. General SME
26. Pure Water Retail

## Subscription Plans

| Feature | Free | Starter | Growth | Business |
|---------|------|---------|--------|-----------|
| Price | NGN 0 | NGN 9,900/mo | NGN 24,900/mo | NGN 49,900/mo |
| Branches | 1 | 2 | 5 | Unlimited |
| Staff | 2 | 5 | 15 | Unlimited |
| Products | 50 | 200 | 1,000 | Unlimited |
| AI Insights | No | Yes | Yes | Yes |
| Trust Fund | No | No | Yes | Yes |
| Referral Program | No | No | Yes | Yes |

## License

Proprietary - Result Seekers Ltd

---

**Taska by Result Seekers** - Built for African businesses.
