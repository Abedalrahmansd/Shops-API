# Comprehensive API Development Document for Shop Platform Backend

## Project Overview
This backend API powers a Flutter app for small businesses (e.g., food, art, services). Users sign up as customers or shop owners (single role, with optional admin flag). Core features: Customizable shops/products, carts/orders via WhatsApp, ratings/reviews, search, analytics. Emphasize security, scalability, free deps. MVP: No chat (mock), no payments (WhatsApp forward), no notifications.

Refined Ideas/Improvements:
- **Additions**: Multi-shop per user, advanced search, shop verification (admin), follows/favorites, reviews with photos, order receipts/approvals, app version check.
- **Edits**: Shop customization as JSON configs (templates + params), icons as selectable templates (not uploads). Ratings shop-level. Carts global with per-shop groups. Personalization light (interests-based).
- **Removals**: No promo codes, no cart expiration, delay chat (use Socket.io later).
- **Overall Vision**: Secure REST API, JSON responses. Handle uploads on disk. Focus on beautiful data structures for Flutter's creative UI.

Tech Stack:
- Node.js v20+ (LTS)
- Express v4+
- DB: MongoDB v7+ (self-hosted, via Mongoose ODM)
- Auth: JWT (jsonwebtoken + bcryptjs)
- Uploads: Multer (disk storage)
- Email: Nodemailer (for verifications, free SMTP like Gmail)
- Security: Helmet, express-rate-limit, mongo-sanitize (anti-injection)
- Logging: Winston
- Testing: Jest (core endpoints)
- Other: Lodash (utils), Cron (jobs like deletions), Socket.io (future chat)
- No paid: All free/open-source.

## Architecture and Folder Structure
Organized MVC-like for clarity. Use ESM (import/export).

```
project-root/
├── src/
│   ├── config/          # Env vars, DB connect
│   │   └── index.js
│   ├── controllers/     # Business logic
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── shop.js
│   │   ├── product.js
│   │   ├── cart.js
│   │   ├── order.js
│   │   ├── review.js
│   │   ├── search.js
│   │   ├── analytics.js
│   │   └── admin.js
│   ├── models/          # Mongo schemas
│   │   ├── User.js
│   │   ├── Shop.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   ├── Report.js
│   │   └── AuditLog.js (optional)
│   ├── middleware/      # Auth, validation, error
│   │   ├── auth.js     # JWT verify
│   │   ├── validate.js # Joi schemas
│   │   ├── error.js
│   │   └── rateLimit.js
│   ├── routes/          # Express routers
│   │   ├── auth.js
│   │   ├── user.js
│   │   └── ... (one per controller)
│   ├── utils/           # Helpers
│   │   ├── email.js
│   │   ├── slugify.js
│   │   └── templateParser.js (for messages)
│   ├── uploads/         # Disk storage (git ignore)
│   └── index.js         # App entry
├── tests/               # Jest tests
├── .env                 # Vars (e.g., DB_URI, JWT_SECRET)
├── .gitignore
├── package.json
└── README.md
```

Setup:
- `npm init -y`
- Install deps: `npm i express mongoose jsonwebtoken bcryptjs multer nodemailer helmet express-rate-limit mongo-sanitize winston lodash cron joi socket.io jest supertest`
- Run: `node src/index.js` (dev: nodemon)
- Prod: PM2 or systemd, behind Nginx.

Env Vars (.env):
- NODE_ENV=development
- PORT=5000
- DB_URI=mongodb://localhost:27017/shopdb
- JWT_SECRET=strongsecret
- EMAIL_HOST=smtp.gmail.com (free)
- EMAIL_USER=yourapp@gmail.com
- EMAIL_PASS=apppassword
- CORS_ORIGIN=* (change to app domain in prod)
- RATE_LIMIT_WINDOW=15 (min)
- RATE_LIMIT_MAX=100 (requests)
- APP_VERSION=1.0.0 (for checks)

## Data Models (MongoDB Schemas via Mongoose)
All models have timestamps (createdAt, updatedAt). Use text indexes for search.

- **User**:
  ```js
  import mongoose from 'mongoose';
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed
    name: { type: String, required: true },
    bio: { type: String },
    avatar: { type: String }, // URL to upload
    phone: { type: String, unique: true, sparse: true }, // Optional unique
    interests: [{ type: String }], // For feed
    shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
    primaryShop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // For deactivation
    deactivationDate: { type: Date }, // For 30-day purge
  });
  userSchema.index({ email: 'text', name: 'text' }); // Search
  export default mongoose.model('User', userSchema);
  ```

- **Shop**:
  ```js
  const shopSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String }],
    uniqueId: { type: String, unique: true }, // User-set or auto
    category: { type: String }, // e.g., 'food'
    phone: { type: String, required: true }, // For WhatsApp
    customization: { type: Object }, // JSON: {template: '1', colors: {...}, layout: [...]}
    icon: { type: Object }, // JSON: {shape: 'circle', color: '#FF0000', overlay: 'roof1'}
    sections: [{ name: String, products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] }], // Custom groups
    rating: { type: Number, default: 0 }, // Average
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false }, // Admin
    messageTemplate: { type: String, default: 'السلام عليكم\n%%products%%\nالاجمالي: {{total}}\n' }, // Customizable
    isActive: { type: Boolean, default: true },
  });
  shopSchema.index({ title: 'text', description: 'text', tags: 'text', uniqueId: 1 });
  export default mongoose.model('Shop', shopSchema);
  ```

- **Product**:
  ```js
  const productSchema = new mongoose.Schema({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' }, // 'USD', 'LBP', custom
    images: [{ type: String }], // URLs
    stock: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  });
  productSchema.index({ title: 'text', description: 'text' });
  export default mongoose.model('Product', productSchema);
  ```

- **Cart** (One per user):
  ```js
  const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
      shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      addedAt: { type: Date, default: Date.now },
    }],
  });
  export default mongoose.model('Cart', cartSchema);
  ```

- **Order** (Receipts):
  ```js
  const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, price: Number, currency: String }],
    total: { type: Number },
    currency: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  });
  export default mongoose.model('Order', orderSchema);
  ```

- **Review** (Shop-level, with optional photo):
  ```js
  const reviewSchema = new mongoose.Schema({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    photo: { type: String }, // URL
    createdAt: { type: Date, default: Date.now },
  });
  export default mongoose.model('Review', reviewSchema);
  ```

- **Report** (Admin queue):
  ```js
  const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['shop', 'product', 'user'] },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  });
  export default mongoose.model('Report', reportSchema);
  ```

- **AuditLog** (Optional for shop changes):
  ```js
  const auditSchema = new mongoose.Schema({
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    action: String, // 'update'
    changes: Object,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  });
  export default mongoose.model('AuditLog', auditSchema);
  ```

## Endpoints
All protected by JWT auth middleware except public ones. Use Joi for validation. Pagination: Query params `page=1&limit=10&all=false` (all=true skips paginate). Errors: {success: false, message: '...', code: 400}.

### Auth Routes (/api/auth)
- POST /register: Body {email, password, name, bio?} → Create user, send verification email.
- POST /login: Body {email, password} → JWT token.
- POST /verify-email: Body {code} → Verify.
- POST /forgot-password: Body {email} → Send reset code.
- POST /reset-password: Body {email, code, newPassword} → Update.
- POST /social-login: Body {provider: 'google', token} → Handle (if implemented).

### User Routes (/api/users)
- GET /me: Get profile.
- PATCH /me: Update name/bio/interests/avatar (upload).
- POST /me/phone: Add/update phone.
- DELETE /me: Deactivate (soft).
- POST /me/reactivate: Before 30 days.
- GET /:id: Public profile (no sensitive).

### Shop Routes (/api/shops)
- POST /: Create {title, desc, tags, category, phone, uniqueId?} → Auto-gen ID if blank.
- GET /:id: Public view (increment views).
- PATCH /:id: Update (owner only), incl. customization/icon/messageTemplate.
- DELETE /:id: Deactivate.
- GET /my: List user's shops.
- PATCH /primary: Body {shopId} → Set primary.
- POST /:id/follow: Follow/unfollow.
- POST /:id/like: Like/unlike.
- POST /:id/share: Increment shares.
- POST /:id/report: Body {reason} → Create report.

### Product Routes (/api/products)
- POST /shops/:shopId: Create {title, desc, price, currency, images[] (upload), stock}.
- GET /shops/:shopId: List with pagination.
- GET /:id: Details (increment views).
- PATCH /:id: Update (owner).
- DELETE /:id: Remove.
- POST /:id/like: Like/unlike.

### Cart Routes (/api/carts)
- GET /me: Get full cart (grouped by shop).
- POST /add: Body {productId, quantity, shopId} → Add/update.
- DELETE /item/:productId: Remove.
- POST /submit/:shopId: Submit per-shop cart → Create Order, generate WhatsApp URL (parse template: e.g., `whatsapp://send?phone=${shop.phone}&text=${parsedMsg}`), return URL.

### Order Routes (/api/orders)
- GET /my: User's orders.
- GET /shop/:shopId: Owner's orders (pending etc.).
- PATCH /:id/approve: Owner approves.
- PATCH /:id/decline: Owner declines.
- DELETE /:id: Owner deletes.

### Review Routes (/api/reviews)
- POST /shops/:shopId: {rating, comment, photo? (upload)}.
- GET /shops/:shopId: List with pagination.
- DELETE /:id: Owner deletes comment (their shop only).
- POST /:id/report: Report review.

### Search Routes (/api/search)
- GET /?q=query&type=all|shops|products|users: Multi-field text search (Mongo $text), paginated. Supports filters (e.g., &category=food).

### Analytics Routes (/api/analytics)
- GET /shop/:shopId: {views, likes, shares, followersCount, orderStats (count, totalRevenue by currency), reviewAvg}.

### Admin Routes (/api/admin) (Admin only)
- GET /reports: List pending.
- PATCH /reports/:id/resolve: Mark resolved.
- PATCH /shops/:id/verify: Verify.
- GET /users: List/manage.
- POST /seed-admin: Create first admin (script).

### Other
- GET /app-version: Return current version from env.
- WebSocket /chat (future): Socket.io for messaging, auth via JWT.

## Security and Best Practices
- **Auth**: Bcrypt hash passwords. JWT sign/verify. Refresh tokens (separate endpoint).
- **Rate Limiting**: 100 req/15min per IP.
- **Injection**: Mongo-sanitize queries.
- **Helmet**: Headers security.
- **CORS**: From env ( * for dev).
- **Uploads**: Multer to /uploads/{type}/{userId}, generate URLs (e.g., /uploads/avatars/user123.jpg). Limit 5MB, images only.
- **Validation**: Joi for all bodies/params.
- **Error Handling**: Global middleware, log with Winston.
- **Cron Jobs**: Daily: Purge deactivated users >30 days, clean old carts.
- **Performance**: Indexes on all search fields. Cache feeds/analytics with Redis if added (self-host).
- **Testing**: Jest unit (models/controllers), integration (endpoints with supertest). Cover core (auth, shops, orders).

## Setup Guide
1. Install MongoDB locally/server.
2. `npm install` deps.
3. Create .env.
4. Run Mongo, then `node src/index.js`.
5. Deploy: Heroku/free VPS, PM2 `pm2 start src/index.js`, Nginx proxy.
6. Seed: Add script for initial data/templates.

## Future Roadmap
- Chat: Implement Socket.io namespaces (e.g., /shop/:id), store messages in new model.
- Notifications: WebSockets or polling.
- Payments: Integrate free gateways if needed.
- Scale: Sharding Mongo, add queues (BullMQ free).