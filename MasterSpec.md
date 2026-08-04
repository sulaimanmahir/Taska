# TASKA Master Product Specification

## Overview

TASKA is a multi-tenant, offline-first, business-type-aware ERP / operating system for African businesses.

Owned by: Result Seekers

Primary launch market:
- Northern Nigeria

Expansion:
- Nigeria
- Africa

---

## Core Promise

Help businesses manage:

- stock
- sales
- money
- branches
- staff
- suppliers
- trust-based finance
- sector operations
- AI-powered intelligence

from one elegant platform.

---

## Supported Business Types

### Standard Business Types
1. **Retail Shop** - Single or multiple retail outlets
2. **Wholesale** - Bulk distribution and wholesale operations
3. **Restaurant** - Food service with tables, menu, kitchen flow
4. **Clinic** - Healthcare with patients, consultations, prescriptions
5. **Hotel** - Accommodation with rooms and bookings
6. **Logistics** - Delivery jobs and route assignments
7. **Farm** - Agricultural tracking with crops, inputs, harvest
8. **Livestock** - Animal management with feeding, health, production
9. **Textile** - Fabric sales with yard/meter tracking
10. **Commodity Trading** - Bulk goods trading
11. **Mixed Business** - Combination of multiple types

### Manufacturing-Lite Business Types
12. **Pure Water Factory** - Manufacturing-lite water production
13. **Pure Water Retail** - Packaged water retail and wholesale

---

## Core Modules

### 1. Authentication
- register business
- login
- profile
- secure access

### 2. Business Management
- profile
- settings
- business type
- module toggles
- AI configuration

### 3. Roles & Permissions
- Role-based access control
- Permission management
- Business-specific roles
- Branch-level roles (future)

### 4. Branches
- Branch CRUD
- Branch-specific inventory
- Branch-specific staff (future)
- Branch performance tracking

### 5. Warehouses
- Warehouse CRUD
- Branch-warehouse linking
- Multi-warehouse inventory
- Warehouse transfers

### 6. Products
- Product categories
- Products with variants
- Units of measure
- Barcode support
- Cost and pricing
- Business-type-aware product fields

### 7. Inventory
- Stock levels per warehouse
- Stock movements
- Reorder points
- Low stock alerts
- Batch tracking
- Expiry tracking
- AI-powered inventory intelligence

### 8. POS / Sales
- Point of sale interface
- Order management
- Receipt generation
- Multiple payment methods
- Branch-aware sales
- AI sales intelligence

### 9. Purchases
- Purchase orders
- GRN (Good Received Note)
- Supplier payments
- Purchase returns

### 10. Customers / CRM
- Customer records
- Customer groups
- Credit limits
- Customer analytics

### 11. Suppliers
- Supplier records
- Payables tracking
- Supplier analytics

### 12. Expenses
- Expense categories
- Expense tracking
- Petty cash management

### 13. Trust Fund
Supports:
- credit accounts
- repayments
- contribution accounts
- statements
- AI-powered financial intelligence

### 14. Staff
- Staff CRUD
- Roles assignment
- Attendance (future)

### 15. Intelligence / AI Layer
TASKA includes a strong AI intelligence layer.

#### AI Capabilities

**1. Inventory Intelligence**
- low stock prediction
- stockout prediction
- overstock detection
- dead stock detection
- reorder recommendations
- fast-moving vs slow-moving analysis
- packaging/raw-material alerts

**2. Sales Intelligence**
- top-selling product patterns
- declining sales alerts
- customer buying pattern analysis
- branch sales anomalies
- recommended upsell/cross-sell insights

**3. Financial / Trust Fund Intelligence**
- overdue repayment risk alerts
- likely default warnings
- contribution irregularity alerts
- unusual repayment pattern detection
- cash flow warning signals
- rising expense anomaly alerts

**4. Branch & Staff Intelligence**
- top-performing branch insights
- underperforming branch alerts
- staff productivity patterns
- suspicious operational anomalies
- cashier performance comparisons

**5. Industry-Specific AI**
- Restaurant: top menu items, low-demand items, peak-time insights
- Clinic: patient volume patterns, service demand patterns
- Lab: turnaround time alerts, high backlog alerts, test demand trends
- Hotel: occupancy patterns, slow periods, booking trends
- Logistics: delayed route patterns, delivery bottlenecks
- Farm: crop productivity alerts, input inefficiency alerts
- Livestock: mortality alerts, declining output alerts, feed-cost inefficiency
- Textile: profitable fabric trends, low-turnover stock alerts
- Commodity: supplier price trend alerts, margin warning signals
- Pure Water Factory: production efficiency alerts, waste pattern alerts, raw material depletion warnings
- Pure Water Retail: package demand trends, retail vs wholesale insights

**6. Recommendation Engine**
- next best action suggestions
- what to restock
- what to reduce
- which customer to follow up
- where to improve branch operations
- how to improve production efficiency
- what financial risk needs attention

#### AI UX Requirements
AI appears in:
- dashboard insight cards
- alert center
- recommendation panels
- trend summaries
- smart assistant widgets
- contextual hints inside workflows
- branch comparison pages
- product detail pages
- customer detail pages
- factory production pages
- livestock/farm dashboards
- lab dashboards

Each insight should answer:
- what happened
- why it matters
- what the user should do next

#### AI Architecture

**Phase 1 AI:**
- rules-based insights
- threshold-based alerts
- analytics-driven recommendations
- business logic intelligence

**Phase 2 AI:**
- predictive models
- trend forecasting
- anomaly scoring
- recommendation ranking
- more advanced operational intelligence

**Data Model Requirements:**
- AI/Intelligence domain module
- insight records (severity, category, recommended action, source metrics)
- alert generation engine
- scheduled analysis jobs
- explainable insight generation
- dismissal/acknowledgement state
- Future model integration readiness

---

### 16. Reports
- Sales reports
- Inventory reports
- Financial reports
- Branch performance reports
- AI-generated insights

### 17. Referrals & Commissions
- Referral codes
- Commission tracking
- Payouts

---

## Industry Modules

### Restaurant
- menu management
- tables management
- kitchen flow
- table reservations
- AI: top menu items, low-demand items, peak-time insights

### Clinic
- patients management
- consultations
- prescriptions
- Patient volume patterns, service demand patterns

### Lab
- tests management
- orders
- results
- imaging
- Turnaround time alerts, high backlog alerts, test demand trends

### Hotel
- rooms management
- bookings
- Occupancy patterns, slow periods, booking trends

### Logistics
- delivery jobs
- assignments
- Delayed route patterns, delivery bottlenecks

### Farm
- crops tracking
- inputs inventory
- harvest tracking
- Crop productivity alerts, input inefficiency alerts

### Livestock
- animals management
- feeding schedules
- health records
- production tracking
- Mortality alerts, declining output alerts, feed-cost inefficiency

### Textile
- yard/meter sales
- Profitable fabric trends, low-turnover stock alerts

### Commodity
- bulk trading
- Supplier price trend alerts, margin warning signals

### Pure Water Factory (Manufacturing-Lite)
**Core Focus:**
- production planning
- raw material/input tracking
- packaging materials tracking
- finished goods inventory
- daily output monitoring
- wastage/damage tracking
- warehouse transfer of finished goods
- distribution to retailers/customers
- machine/downtime awareness where practical
- cost and profit visibility

**Key Fields:**
- production_capacity_per_day
- water_source_type
- treatment_line_enabled
- packaging_types
- sachet_bag_size
- bottle_sizes
- batch_tracking_enabled
- machine_count
- distribution_enabled
- quality_check_enabled

**Core Workflows:**
1. register raw materials and consumables
2. record production batch
3. convert inputs into finished goods
4. record output quantities by product type
5. track damaged/wasted output
6. move finished goods into warehouse
7. distribute or sell to retailers/customers
8. monitor production, stock, and daily movement

**Module Priorities:**
- Inventory (very high)
- Production / Manufacturing-Lite (very high)
- Warehouses (high)
- Sales / Distribution (high)
- Expenses (high)
- Suppliers (high)
- Reports (high)
- AI Insights (high)

**Dashboard:**
- production today
- finished goods available
- low raw materials
- damaged/waste summary
- sales today
- distribution summary
- production efficiency
- alerts for low packaging materials
- machine downtime alerts (if enabled)

**AI Capabilities:**
- production efficiency alerts
- waste pattern alerts
- raw material depletion warnings
- output trend analysis

### Pure Water Retail
**Core Focus:**
- fast sales
- stock tracking
- sachet/bottle/crate/pack movement
- retailer and customer sales
- branch-level retail/wholesale visibility
- pricing tiers

**Key Fields:**
- sells_sachet_water
- sells_bottled_water
- wholesale_enabled
- retailer_pricing_enabled
- crate_tracking_enabled
- package_type_support

**Core Workflows:**
1. receive stock from factory or supplier
2. sell retail or wholesale
3. manage multiple package types
4. manage pricing tiers
5. track customer balances if Trust Fund is enabled
6. monitor stock by branch/warehouse

**Module Priorities:**
- POS / Sales (very high)
- Inventory (high)
- CRM (medium)
- Trust Fund (medium if credit is used)
- Reports (high)
- AI Insights (medium/high)

**Dashboard:**
- sales today
- stock by package type
- top customers/retailers
- low stock alerts
- wholesale vs retail summary
- branch stock movement

**AI Capabilities:**
- package demand trends
- retail vs wholesale insights
- stock replenishment alerts

---

## UX Standard

TASKA must feel:

- elegant
- premium
- simple
- beautiful
- fast
- trustworthy
- modern
- highly engaging
- AI-powered yet still simple

The AI layer must:
- Be visible but not intrusive
- Be explainable
- Build confidence
- Provide immediate value

---

## Build Priority

1. **Foundation** - Auth, Business, Branches, Warehouses, Products, Inventory
2. **Commerce Core** - POS, Purchases, CRM, Suppliers, Expenses
3. **Trust Fund** - Credit accounts, repayments, contributions
4. **Reports & AI** - Intelligence layer, reports, insights
5. **Industry Modules** - Restaurant, Clinic, Lab, Hotel, etc.
6. **Advanced Industry** - Pure Water Factory, Livestock, Farm, Logistics
7. **Offline Sync** - PWA capabilities, local storage
8. **Advanced Intelligence** - Predictive models, forecasting

---

## Important Rules

### Architecture First
- Do not build random features
- Always preserve clean architecture
- Keep business-type awareness in mind
- Design for AI/ML readiness from the start

### Manufacturing-Lite Guidelines
TASKA supports manufacturing-lite, NOT heavy manufacturing ERP. Keep it:
- Practical for SMEs
- Simple production tracking
- Focused on outputs and wastage
- Distribution-ready

### AI Integration Guidelines
- Build AI as a product feature, not an afterthought
- Make every insight explainable
- Answer: what happened, why it matters, what to do
- Keep it practical and useful
- Never create "black box" AI

### UX Guidelines
- Great first impression
- Low-friction onboarding
- Premium dashboards
- Business-type-aware flows
- AI-powered but still simple
- Strong return value so users want to come back