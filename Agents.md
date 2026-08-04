# TASKA Development Rules

You are building TASKA, a production-grade business operating system developed by Result Seekers.

TASKA is:
- multi-tenant
- offline-first
- business-type-aware
- modular
- API-first
- elegant and premium
- AI-powered

## Tech Stack

Backend:
- Laravel latest stable
- PostgreSQL (SQLite for development)
- Sanctum
- Service layer architecture
- Form Requests
- Policies
- API Resources

Frontend:
- React
- Vite
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form + Zod
- PWA capable

## Non-Negotiable Rules

### Architecture
- Thin controllers
- Business logic in Services
- Domain-based structure
- Clean naming
- Reusable components
- No messy flat architecture

### Multi-Tenant Rules
Every tenant-owned record must include:
- business_id

Branch-aware records include:
- branch_id

Strict tenant isolation required.

### Manufacturing-Lite Support
TASKA supports manufacturing-lite workflows for suitable business types such as:
- Pure Water Factory
- Future small-scale production businesses

This includes:
- Raw materials inventory
- Production batches
- Finished goods output
- Wastage/damage tracking
- Warehouse transfer of finished goods
- Distribution-ready stock visibility
- Production cost visibility
- Production reporting
- AI-powered production insights

### Pharmacy Support
TASKA supports Pharmacy as a first-class business type with:
- Expiry tracking
- Batch tracking
- Strict stock monitoring
- Pharmacy-aware inventory warnings
- Sales workflows suitable for pharmacy
- Dashboard widgets relevant to pharmacy operations

### AI/Intelligence Integration
AI must be built as a first-class product feature, not an afterthought. When building modules:
- Always consider what data must be exposed for future AI/ML capabilities
- Design data structures to support future machine learning even if initial version is rules-based
- Insights must remain explainable and practical
- Never build "black box" AI - every insight should answer: what happened, why it matters, what to do next

Examples:
- When building inventory: expose data needed for stock intelligence (movement patterns, reorder points, dead stock detection, expiry alerts)
- When building sales: expose data needed for demand analysis (trends, seasonality, branch comparisons)
- When building Trust Fund: expose data needed for repayment risk analysis (payment patterns, overdue indicators)
- When building Pharmacy: expose data for expiry tracking and drug demand analysis
- When building Pure Water Factory: expose data for production efficiency and waste analysis
- When building livestock: expose data for health and productivity insights

### UI/UX Rules
UI must be:
- elegant
- beautiful
- premium
- simple
- highly usable
- responsive
- engaging

AI UI must:
- Be visible but not intrusive
- Appear in dashboard insight cards, alert centers, recommendation panels
- Be clear, explainable, confidence-building
- Answer: what happened, why it matters, what to do next

Avoid:
- ugly admin templates
- clutter
- weak spacing
- poor typography
- gimmicky AI features

### Code Rules
- Use real production code
- No placeholders unless explicitly marked
- Keep imports correct
- Keep backend/frontend aligned
- Use transactions for critical writes

### Build Behavior
When asked to implement a feature:
1. analyze existing structure
2. create plan
3. implement cleanly
4. update related files
5. keep consistency
6. consider AI/insight opportunities

## Modules

Core modules include:
- Auth
- Business
- Branches
- Warehouses
- Products
- Inventory
- POS / Sales
- Purchases
- CRM (Customers)
- Suppliers
- Expenses
- Trust Fund
- Staff
- Reports
- Referrals
- Intelligence / AI Layer

Industry Modules:
- Restaurant
- Clinic
- Laboratory / Diagnostics
- Hotel
- Logistics
- Farm
- Livestock
- Textile
- Commodity
- NGO Warehouse
- Pure Water Factory (Manufacturing-Lite)
- Pure Water Retail
- Pharmacy

## Business Types (26 Total)

1. Retail / Shop / Kiosk
2. Supermarket
3. Pharmacy (with expiry tracking)
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

### Pure Water Factory (Manufacturing-Lite)
Core Focus:
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

Key Fields:
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

### Pure Water Retail
Core Focus:
- fast sales
- stock tracking
- sachet/bottle/crate/pack movement
- retailer and customer sales
- branch-level retail/wholesale visibility
- pricing tiers

Key Fields:
- sells_sachet_water
- sells_bottled_water
- wholesale_enabled
- retailer_pricing_enabled
- crate_tracking_enabled
- package_type_support

### Pharmacy Business Type
Core Focus:
- expiry tracking for all products
- batch tracking
- strict stock monitoring
- pharmacy-aware inventory warnings
- prescription workflow support
- fast-moving drug insights

Key Fields:
- enable_expiry_tracking
- enable_batch_tracking
- low_stock_alert_days (e.g., warn 30 days before expiry)
- prescription_required_categories

## Final Rule
Always optimize for long-term maintainability and premium product quality.

---

## Result Seekers Ltd
- Website: www.result-seekers.com
- Developer and owner of TASKA
