### Continued Development Plan for Implementing the Shop Platform Backend API

Based on our previous discussions and the comprehensive API document, we've already set up the foundation: folder structure, `src/index.js` (main app entry), `src/config/index.js` (env loader), `.gitignore` (to ignore node_modules, .env, uploads), models (e.g., User.js), utils (e.g., email.js, slugify.js, templateParser.js), and middleware (e.g., auth.js). We've also provided code for feed and search controllers.

Now, to fully build the project, we'll continue with the iterations from the plan. Since you mentioned we've created initial things, I'll assume Iteration 1 (Auth and Users) is partially done, and we'll complete it here with full code. Then, outline the full plan with code for key parts in subsequent iterations. I'll provide complete, copy-paste-ready code for each section, ensuring it's JS/ESM, organized, and aligns with the document.

If you implement this and run into issues, share errors/output, and I'll debug (I can use the code_execution tool if needed to test snippets).

#### Quick Recap of Progress
- Setup: Project init, deps installed, DB connect in index.js.
- Models: User.js (and others sketched).
- Utils: email.js, slugify.js, templateParser.js.
- Middleware: auth.js.
- Controllers: Partial (feed, search provided).

#### Full Building Plan
We'll complete in phases (iterations). Each includes code, testing notes. After each, test locally (npm run dev, Postman).

**Phase 1: Complete Iteration 1 - Core Auth and Users** (Focus: Secure auth, profiles. ~2-3 hours)
1. **Add Joi for Validation** (middleware/validate.js):
   ```js
   // src/middleware/validate.js
   import Joi from 'joi';

   export const validate = (schema) => (req, res, next) => {
     const { error } = schema.validate(req.body);
     if (error) return res.status(400).json({ success: false, message: error.details[0].message });
     next();
   };

   // Example schemas (export and use in controllers)
   export const registerSchema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(6).required(),
     name: Joi.string().required(),
     bio: Joi.string().optional(),
   });
   ```

2. **Error Middleware** (middleware/error.js):
   ```js
   // src/middleware/error.js
   export const errorHandler = (err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({ success: false, message: 'Server error' });
   };
   ```

3. **Auth Controller** (controllers/auth.js):
   ```js
   // src/controllers/auth.js
   import bcrypt from 'bcryptjs';
   import jwt from 'jsonwebtoken';
   import User from '../models/User.js';
   import { sendEmail } from '../utils/email.js';
   import { config } from '../config/index.js';

   // Helper to generate 6-digit code
   const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

   export const register = async (req, res) => {
     const { email, password, name, bio } = req.body;
     let user = await User.findOne({ email });
     if (user) return res.status(400).json({ message: 'User exists' });

     const hashed = await bcrypt.hash(password, 10);
     user = new User({ email, password: hashed, name, bio });
     await user.save();

     const code = generateCode();
     // Store code temporarily (e.g., in user doc or Redis; for simplicity, email only)
     await sendEmail(email, 'Verify Email', `Your code: ${code}`);

     res.status(201).json({ success: true, message: 'User created, verify email' });
   };

   export const login = async (req, res) => {
     const { email, password } = req.body;
     const user = await User.findOne({ email });
     if (!user || !(await bcrypt.compare(password, user.password))) {
       return res.status(401).json({ message: 'Invalid credentials' });
     }
     const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, config.JWT_SECRET, { expiresIn: '15m' });
     res.json({ success: true, token });
   };

   export const verifyEmail = async (req, res) => {
     // In prod, compare sent code (stored in temp field or email-only for MVP)
     // Assume manual check for now; add logic as needed
     res.json({ success: true, message: 'Email verified' });
   };

   export const forgotPassword = async (req, res) => {
     const { email } = req.body;
     const user = await User.findOne({ email });
     if (!user) return res.status(404).json({ message: 'User not found' });

     const code = generateCode();
     await sendEmail(email, 'Reset Password', `Your code: ${code}`);
     res.json({ success: true, message: 'Reset code sent' });
   };

   export const resetPassword = async (req, res) => {
     const { email, code, newPassword } = req.body;
     // Verify code (MVP: assume valid); hash new pass
     const user = await User.findOne({ email });
     if (!user) return res.status(404).json({ message: 'User not found' });
     user.password = await bcrypt.hash(newPassword, 10);
     await user.save();
     res.json({ success: true, message: 'Password reset' });
   };

   // Social login placeholder (implement if needed)
   export const socialLogin = (req, res) => res.json({ message: 'Not implemented' });
   ```

4. **User Controller** (controllers/user.js):
   ```js
   // src/controllers/user.js
   import User from '../models/User.js';
   import multer from 'multer'; // For avatar upload (setup in routes)

   export const getMe = async (req, res) => {
     const user = await User.findById(req.user.id).select('-password');
     res.json({ success: true, user });
   };

   export const updateMe = async (req, res) => {
     const updates = { name: req.body.name, bio: req.body.bio, interests: req.body.interests };
     if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;
     const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
     res.json({ success: true, user });
   };

   export const addPhone = async (req, res) => {
     const { phone } = req.body;
     await User.findByIdAndUpdate(req.user.id, { phone });
     res.json({ success: true });
   };

   export const deactivate = async (req, res) => {
     await User.findByIdAndUpdate(req.user.id, { isActive: false, deactivationDate: new Date() });
     res.json({ success: true, message: 'Account deactivated' });
   };

   export const reactivate = async (req, res) => {
     const user = await User.findById(req.user.id);
     if (user.deactivationDate && (Date.now() - user.deactivationDate) < 30 * 24 * 60 * 60 * 1000) {
       user.isActive = true;
       user.deactivationDate = null;
       await user.save();
       res.json({ success: true });
     } else {
       res.status(400).json({ message: 'Cannot reactivate' });
     }
   };

   export const getUser = async (req, res) => {
     const user = await User.findById(req.params.id).select('name bio avatar');
     res.json({ success: true, user });
   };
   ```

5. **Routes** (routes/auth.js and routes/user.js):
   ```js
   // src/routes/auth.js
   import express from 'express';
   import { register, login, verifyEmail, forgotPassword, resetPassword, socialLogin } from '../controllers/auth.js';
   import { validate, registerSchema } from '../middleware/validate.js';

   const router = express.Router();
   router.post('/register', validate(registerSchema), register);
   router.post('/login', login);
   router.post('/verify-email', verifyEmail);
   router.post('/forgot-password', forgotPassword);
   router.post('/reset-password', resetPassword);
   router.post('/social-login', socialLogin);

   export default router;
   ```

   ```js
   // src/routes/user.js
   import express from 'express';
   import { getMe, updateMe, addPhone, deactivate, reactivate, getUser } from '../controllers/user.js';
   import { authMiddleware } from '../middleware/auth.js';
   import multer from 'multer';

   const upload = multer({ dest: 'src/uploads/avatars/' });

   const router = express.Router();
   router.get('/me', authMiddleware, getMe);
   router.patch('/me', authMiddleware, upload.single('avatar'), updateMe);
   router.post('/me/phone', authMiddleware, addPhone);
   router.delete('/me', authMiddleware, deactivate);
   router.post('/me/reactivate', authMiddleware, reactivate);
   router.get('/:id', getUser); // Public

   export default router;
   ```

6. **Update index.js to Include Routes and Middleware**:
   Add to existing index.js:
   ```js
   // ... existing imports
   import authRoutes from './routes/auth.js';
   import userRoutes from './routes/user.js';
   import { errorHandler } from './middleware/error.js';
   import mongoSanitize from 'mongo-sanitize';

   app.use((req, res, next) => {
     req.body = mongoSanitize(req.body);
     next();
   });

   app.use('/api/auth', authRoutes);
   app.use('/api/users', userRoutes);

   app.use(errorHandler); // At end
   ```

7. **Testing**:
   - Run `npm run dev`.
   - Postman: POST /api/auth/register with body → Check DB/user created, email sent (configure Gmail app password).
   - Test login → Get token.
   - Add Jest test (tests/auth.test.js):
     ```js
     // tests/auth.test.js
     import supertest from 'supertest';
     import app from '../src/index.js'; // Adjust if needed

     describe('Auth', () => {
       it('registers user', async () => {
         const res = await supertest(app)
           .post('/api/auth/register')
           .send({ email: 'test@example.com', password: '123456', name: 'Test' });
         expect(res.status).toBe(201);
       });
     });
     ```
   - Run: `npm test`.

Milestone: Auth works, users can register/login/update.

**Phase 2: Iteration 2 - Shops and Customization** (~3-4 hours)
1. Add Shop model (already in doc).
2. Controllers/shop.js: Implement create, get, update, etc., using slugify for uniqueId.
3. Routes/shop.js: Similar to user, with auth/owner checks.
4. Add admin check middleware (if isAdmin).
5. Test: Create shop, update customization JSON.

**Phase 3: Iteration 3 - Products, Carts, Orders** (~4 hours)
1. Models: Product, Cart, Order.
2. Uploads: Update multer for products (e.g., /uploads/products).
3. Controllers: CRUD for products, cart add/submit (use templateParser).
4. Routes: Protect with auth.
5. Test order flow.

**Phase 4: Iteration 4 - Interactions, Search, Analytics** (~3 hours)
1. Models: Review, Report.
2. Controllers: Reviews, search (already provided), analytics (aggregate).
3. Add feed (provided).
4. Cron job in utils/cron.js (import cron, schedule purge).
5. Mock chats route: GET /api/chats → {message: 'Disabled'}.

**Phase 5: Iteration 5 - Polish and Deployment** (~2 hours)
1. Full security: Rate limits per route.
2. Logging: Winston setup in index.js.
3. Deploy guide: Add to README.

**Overall Timeline**: 1-2 weeks if daily work. Next: Implement Phase 1 code above, test, then ask for Phase 2 code if needed. If you need to test any snippet, let me know!


# Phase 2: Iteration 2 - Shops and Customization

Great to hear Phase 1 worked well! Now, we'll implement shops, including creation, editing, multi-shop support, customization (as JSON), icons, and interactions like follow/like/share/report. This builds on the auth/user foundation—shops are owned by users, and actions are protected.

**Steps in this Phase** (~3-4 hours):
1. **Add Shop Model**: Already sketched in the doc; implement it.
2. **Add Owner Check Middleware**: To ensure only owners edit their shops.
3. **Controllers for Shops**: CRUD, interactions, primary set.
4. **Routes for Shops**: With auth and owner protections.
5. **Admin Middleware**: For verification.
6. **Update User Model Integration**: When creating shop, add to user's shops array.
7. **Testing**: Postman/Jest for shop flows.

### 1. Shop Model (models/Shop.js)
```js
// src/models/Shop.js
import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  uniqueId: { type: String, unique: true },
  category: { type: String },
  phone: { type: String, required: true },
  customization: { type: Object, default: {} }, // e.g., {template: 'basic', colors: {primary: '#FF0000'}, layout: ['hero', 'products']}
  icon: { type: Object, default: {} }, // e.g., {shape: 'circle', color: '#00FF00', background: 'pattern1', overlay: 'roof2'}
  sections: [{ name: String, products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] }],
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array for unique likes
  shares: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  messageTemplate: { type: String, default: 'السلام عليكم\n%%foreach products: $product: $quantity\n%%\nالاجمالي: {{total}}' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

shopSchema.index({ title: 'text', description: 'text', tags: 'text', uniqueId: 1 });

export default mongoose.model('Shop', shopSchema);
```

### 2. Owner Check Middleware (middleware/owner.js)
```js
// src/middleware/owner.js
import Shop from '../models/Shop.js';

export const isOwner = async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });
  if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not owner' });
  next();
};
```

### 3. Admin Check Middleware (middleware/admin.js)
```js
// src/middleware/admin.js
export const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
};
```

### 4. Shop Controller (controllers/shop.js)
```js
// src/controllers/shop.js
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { slugify } from '../utils/slugify.js';

export const createShop = async (req, res) => {
  const { title, description, tags, category, phone, uniqueId } = req.body;
  let finalUniqueId = uniqueId || slugify(title);

  // Check uniqueness
  let existing = await Shop.findOne({ uniqueId: finalUniqueId });
  while (existing) {
    finalUniqueId = slugify(title) + '-' + Math.floor(Math.random() * 1000);
    existing = await Shop.findOne({ uniqueId: finalUniqueId });
  }

  const shop = new Shop({
    owner: req.user.id,
    title,
    description,
    tags,
    category,
    phone,
    uniqueId: finalUniqueId,
  });
  await shop.save();

  // Add to user's shops and set primary if first
  const user = await User.findById(req.user.id);
  user.shops.push(shop._id);
  if (!user.primaryShop) user.primaryShop = shop._id;
  await user.save();

  res.status(201).json({ success: true, shop });
};

export const getShop = async (req, res) => {
  const shop = await Shop.findOne({ uniqueId: req.params.id } || { _id: req.params.id }).populate('owner', 'name');
  if (!shop || !shop.isActive) return res.status(404).json({ message: 'Shop not found or closed' });
  shop.views += 1;
  await shop.save();
  res.json({ success: true, shop });
};

export const updateShop = async (req, res) => {
  const updates = req.body; // incl. customization, icon, messageTemplate
  const shop = await Shop.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, shop });
};

export const deactivateShop = async (req, res) => {
  await Shop.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Shop deactivated' });
};

export const getMyShops = async (req, res) => {
  const user = await User.findById(req.user.id).populate('shops');
  res.json({ success: true, shops: user.shops });
};

export const setPrimary = async (req, res) => {
  const { shopId } = req.body;
  const user = await User.findById(req.user.id);
  if (!user.shops.includes(shopId)) return res.status(400).json({ message: 'Not your shop' });
  user.primaryShop = shopId;
  await user.save();
  res.json({ success: true });
};

export const followShop = async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  const index = shop.followers.indexOf(req.user.id);
  if (index === -1) {
    shop.followers.push(req.user.id);
  } else {
    shop.followers.splice(index, 1);
  }
  await shop.save();
  res.json({ success: true, followers: shop.followers.length });
};

export const likeShop = async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  const index = shop.likes.indexOf(req.user.id);
  if (index === -1) {
    shop.likes.push(req.user.id);
  } else {
    shop.likes.splice(index, 1);
  }
  await shop.save();
  res.json({ success: true, likes: shop.likes.length });
};

export const shareShop = async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
  res.json({ success: true, shares: shop.shares });
};

export const reportShop = async (req, res) => {
  const { reason } = req.body;
  // Create Report (model not yet, but placeholder)
  // For now: console.log(`Report: ${reason}`);
  res.json({ success: true, message: 'Reported' });
};

export const verifyShop = async (req, res) => {
  await Shop.findByIdAndUpdate(req.params.id, { isVerified: true });
  res.json({ success: true });
};
```

### 5. Shop Routes (routes/shop.js)
```js
// src/routes/shop.js
import express from 'express';
import { createShop, getShop, updateShop, deactivateShop, getMyShops, setPrimary, followShop, likeShop, shareShop, reportShop, verifyShop } from '../controllers/shop.js';
import { authMiddleware } from '../middleware/auth.js';
import { isOwner } from '../middleware/owner.js';
import { isAdmin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().optional(),
  phone: Joi.string().required(),
  uniqueId: Joi.string().optional(),
});

const router = express.Router();
router.post('/', authMiddleware, validate(createSchema), createShop);
router.get('/:id', getShop); // Public, by id or uniqueId
router.patch('/:id', authMiddleware, isOwner, updateShop);
router.delete('/:id', authMiddleware, isOwner, deactivateShop);
router.get('/my', authMiddleware, getMyShops);
router.patch('/primary', authMiddleware, setPrimary);
router.post('/:id/follow', authMiddleware, followShop);
router.post('/:id/like', authMiddleware, likeShop);
router.post('/:id/share', authMiddleware, shareShop);
router.post('/:id/report', authMiddleware, reportShop);
router.patch('/:id/verify', authMiddleware, isAdmin, verifyShop);

export default router;
```

### 6. Update index.js
Add:
```js
// In src/index.js
import shopRoutes from './routes/shop.js';
// ...
app.use('/api/shops', shopRoutes);
```

### 7. Testing
- Postman: Auth with token from login → POST /api/shops (body) → Check shop created, uniqueId generated, added to user.shops.
- Update: PATCH /api/shops/:id with {customization: {template: '1'}}.
- Interactions: POST /api/shops/:id/like.
- Jest (tests/shop.test.js):
  ```js
  // tests/shop.test.js
  import supertest from 'supertest';
  import app from '../src/index.js';

  describe('Shops', () => {
    let token; // Get from login test or mock
    it('creates shop', async () => {
      const res = await supertest(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Shop', phone: '123456' });
      expect(res.status).toBe(201);
    });
  });
  ```
- Edge: Try updating non-owned shop → 403.

Milestone: Shops fully functional, customizable. Proceed to Phase 3 (Products/Carts/Orders) once tested. If issues (e.g., DB errors), share details!

# Phase 3: Iteration 3 - Products, Carts, Orders

Awesome that Phase 2 worked! Now, we'll add products (with uploads), carts (global per user, grouped by shop), and orders (receipts with WhatsApp integration). This includes CRUD for products, cart management, and order submission/approval. Uses templateParser from utils.

**Steps in this Phase** (~4 hours):
1. **Add Models**: Product, Cart, Order (from doc).
2. **Update Uploads**: Configure Multer for products/reviews (multi-image).
3. **Controllers**: For products, carts, orders.
4. **Routes**: With auth/owner checks.
5. **Integrate with Shops**: Add products to shop sections.
6. **Testing**: Full flow (add product, add to cart, submit order).

### 1. Product Model (models/Product.js)
```js
// src/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
```

### 2. Cart Model (models/Cart.js)
```js
// src/models/Cart.js
import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
```

### 3. Order Model (models/Order.js)
```js
// src/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number },
    price: { type: Number },
    currency: { type: String },
  }],
  total: { type: Number },
  currency: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
```

### 4. Update Multer for Uploads (middleware/upload.js - New File)
```js
// src/middleware/upload.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'others';
    if (file.fieldname === 'images') folder = 'products';
    if (file.fieldname === 'avatar') folder = 'avatars';
    if (file.fieldname === 'photo') folder = 'reviews';
    cb(null, `src/uploads/${folder}`);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Not an image'), false);
  },
});
```

### 5. Product Controller (controllers/product.js)
```js
// src/controllers/product.js
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

export const createProduct = async (req, res) => {
  const { title, description, price, currency, stock, sectionName } = req.body;
  const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

  const product = new Product({
    shop: req.params.shopId,
    title,
    description,
    price,
    currency,
    images,
    stock,
  });
  await product.save();

  // Add to shop section
  const shop = await Shop.findById(req.params.shopId);
  let section = shop.sections.find(s => s.name === sectionName);
  if (!section) {
    section = { name: sectionName || 'Default', products: [] };
    shop.sections.push(section);
  }
  section.products.push(product._id);
  await shop.save();

  res.status(201).json({ success: true, product });
};

export const getProducts = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const query = { shop: req.params.shopId };
  const products = await Product.find(query)
    .skip(all ? 0 : (page - 1) * limit)
    .limit(all ? Infinity : parseInt(limit));
  res.json({ success: true, products });
};

export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.views += 1;
  await product.save();
  res.json({ success: true, product });
};

export const updateProduct = async (req, res) => {
  const updates = req.body;
  if (req.files) updates.images = req.files.map(file => `/uploads/products/${file.filename}`);
  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, product });
};

export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  // Remove from shop sections (optional: loop and splice)
  res.json({ success: true });
};

export const likeProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const index = product.likes.indexOf(req.user.id);
  if (index === -1) product.likes.push(req.user.id);
  else product.likes.splice(index, 1);
  await product.save();
  res.json({ success: true, likes: product.likes.length });
};
```

### 6. Cart Controller (controllers/cart.js)
```js
// src/controllers/cart.js
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });
  // Group by shop (for Flutter)
  const grouped = cart.items.reduce((acc, item) => {
    const shopId = item.shop.toString();
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(item);
    return acc;
  }, {});
  res.json({ success: true, cart: { ...cart.toObject(), grouped } });
};

export const addToCart = async (req, res) => {
  const { productId, quantity, shopId } = req.body;
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });

  const index = cart.items.findIndex(i => i.product.toString() === productId);
  if (index > -1) cart.items[index].quantity += quantity || 1;
  else cart.items.push({ shop: shopId, product: productId, quantity: quantity || 1 });

  // Sort by addedAt desc
  cart.items.sort((a, b) => b.addedAt - a.addedAt);
  await cart.save();
  res.json({ success: true, cart });
};

export const removeItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true });
};

// Submit in next controller
```

### 7. Order Controller (controllers/order.js)
```js
// src/controllers/order.js
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import { parseMessageTemplate } from '../utils/templateParser.js';

export const submitOrder = async (req, res) => {
  const shopId = req.params.shopId;
  const cart = await Cart.findOne({ user: req.user.id });
  const shopItems = cart.items.filter(i => i.shop.toString() === shopId);
  if (!shopItems.length) return res.status(400).json({ message: 'No items for this shop' });

  // Calc total
  let total = 0;
  const items = await Promise.all(shopItems.map(async i => {
    const product = await Product.findById(i.product);
    total += product.price * i.quantity;
    return { product: i.product, quantity: i.quantity, price: product.price, currency: product.currency };
  }));

  const order = new Order({
    user: req.user.id,
    shop: shopId,
    items,
    total,
    currency: items[0].currency, // Assume same
  });
  await order.save();

  // Remove from cart
  cart.items = cart.items.filter(i => i.shop.toString() !== shopId);
  await cart.save();

  // Generate WhatsApp msg
  const shop = await Shop.findById(shopId);
  const products = items.map(i => ({ title: (await Product.findById(i.product)).title, quantity: i.quantity }));
  const parsedMsg = parseMessageTemplate(shop.messageTemplate, { products, total });
  const waUrl = `whatsapp://send?phone=${shop.phone}&text=${encodeURIComponent(parsedMsg)}`;

  res.json({ success: true, order, waUrl });
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('shop', 'title');
  res.json({ success: true, orders });
};

export const getShopOrders = async (req, res) => {
  const orders = await Order.find({ shop: req.params.shopId }).populate('user', 'name');
  res.json({ success: true, orders });
};

export const approveOrder = async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, { status: 'approved' });
  res.json({ success: true });
};

export const declineOrder = async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, { status: 'declined' });
  res.json({ success: true });
};

export const deleteOrder = async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
```

### 8. Routes
```js
// src/routes/product.js
import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct, likeProduct } from '../controllers/product.js';
import { authMiddleware } from '../middleware/auth.js';
import { isOwner } from '../middleware/owner.js'; // Reuse for product (check shop owner)
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.post('/shops/:shopId', authMiddleware, isOwner, upload.array('images', 5), createProduct);
router.get('/shops/:shopId', getProducts);
router.get('/:id', getProduct);
router.patch('/:id', authMiddleware, isOwner, upload.array('images', 5), updateProduct);
router.delete('/:id', authMiddleware, isOwner, deleteProduct);
router.post('/:id/like', authMiddleware, likeProduct);

export default router;
```

```js
// src/routes/cart.js
import express from 'express';
import { getCart, addToCart, removeItem } from '../controllers/cart.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/me', authMiddleware, getCart);
router.post('/add', authMiddleware, addToCart);
router.delete('/item/:productId', authMiddleware, removeItem);

export default router;
```

```js
// src/routes/order.js
import express from 'express';
import { submitOrder, getMyOrders, getShopOrders, approveOrder, declineOrder, deleteOrder } from '../controllers/order.js';
import { authMiddleware } from '../middleware/auth.js';
import { isOwner } from '../middleware/owner.js';

const router = express.Router();
router.post('/submit/:shopId', authMiddleware, submitOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/shop/:shopId', authMiddleware, isOwner, getShopOrders);
router.patch('/:id/approve', authMiddleware, isOwner, approveOrder);
router.patch('/:id/decline', authMiddleware, isOwner, declineOrder);
router.delete('/:id', authMiddleware, isOwner, deleteOrder);

export default router;
```

### 9. Update index.js
```js
// In src/index.js
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
// ...
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
```

### 10. Testing
- Postman: Create shop → POST /api/products/shops/:shopId (with images) → Add to cart → Submit → Check order created, WA URL.
- Jest: Add tests for createProduct, addToCart.
- Edge: Stock check (optional: add if stock < quantity, error).

Milestone: Full purchasing flow. Next: Phase 4 (Interactions/Search/Analytics). Test and confirm!


# Phase 4: Iteration 4 - Interactions, Search, Analytics

Your changes look solid—using User ID arrays for views/likes ensures uniqueness (good for accurate counts via .length), specific owner checks in middleware enhance security, and auth on more routes prevents unauth access. The roadmap/project plan remains on track: MVP core is built, now add engagement features. No major suggestions; I've adjusted Phase 4 code to match (e.g., use .length for counts, :reviewId in routes, photo uploads).

**Steps in this Phase** (~3 hours):
1. **Add Models**: Review, Report (AuditLog optional—skip for MVP).
2. **Controllers**: Reviews (CRUD, with owner delete), reports (admin), search (multi-field, using text indexes), analytics (aggregates on shop metrics).
3. **Routes**: With auth/owner/admin checks.
4. **Cron Jobs**: Purge script (daily deactivated users/carts).
5. **Mock Chats**: Empty route.
6. **Update Feed/Search**: Integrate provided code, adjust for arrays.
7. **Testing**: Basic flows.

### 1. Review Model (models/Review.js)
```js
// src/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  photo: { type: String }, // URL
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
```

### 2. Report Model (models/Report.js)
```js
// src/models/Report.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['shop', 'product', 'user', 'review'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
```

### 3. AuditLog Model (models/AuditLog.js) - Optional, add if needed for changes tracking
```js
// src/models/AuditLog.js
import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true }, // e.g., 'update'
  changes: { type: Object },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);
```

### 4. Update Owner Middleware (middleware/owner.js) - Add for Review
Add to existing file:
```js
// ... existing imports
import Review from '../models/Review.js';

export const isReviewOwner = async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  const shop = await Shop.findById(review.shop);
  if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not shop owner' });
  next();
};
```

### 5. Review Controller (controllers/review.js)
```js
// src/controllers/review.js
import Review from '../models/Review.js';
import Shop from '../models/Shop.js';

export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const photo = req.file ? `/uploads/reviews/${req.file.filename}` : null;

  const review = new Review({
    shop: req.params.shopId,
    user: req.user.id,
    rating,
    comment,
    photo,
  });
  await review.save();

  // Update shop average rating
  const shop = await Shop.findById(req.params.shopId);
  const reviews = await Review.find({ shop: shop._id });
  shop.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  shop.ratingCount = reviews.length;
  await shop.save();

  res.status(201).json({ success: true, review });
};

export const getReviews = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const reviews = await Review.find({ shop: req.params.shopId })
    .populate('user', 'name avatar')
    .skip(all ? 0 : (page - 1) * limit)
    .limit(all ? Infinity : parseInt(limit));
  res.json({ success: true, reviews });
};

export const deleteReview = async (req, res) => {
  await Review.findByIdAndDelete(req.params.reviewId);
  // Recalc shop rating (similar to create)
  const shop = await Shop.findById(req.params.shopId); // Assume shopId from req or fetch from review
  const reviews = await Review.find({ shop: shop._id });
  shop.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  shop.ratingCount = reviews.length;
  await shop.save();
  res.json({ success: true });
};

export const reportReview = async (req, res) => {
  const { reason } = req.body;
  const report = new Report({
    reporter: req.user.id,
    targetType: 'review',
    targetId: req.params.reviewId,
    reason,
  });
  await report.save();
  res.json({ success: true, message: 'Review reported' });
};
```

### 6. Search Controller (controllers/search.js) - Enhanced for multi-ways (text, ID, etc.)
```js
// src/controllers/search.js
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const search = async (req, res) => {
  const { q, type = 'all', page = 1, limit = 10, all = false } = req.query;
  let results = {};

  const textQuery = { $text: { $search: q } };
  const idQuery = mongoose.Types.ObjectId.isValid(q) ? { _id: q } : null;
  const query = idQuery ? { $or: [textQuery, idQuery] } : textQuery;

  if (type === 'all' || type === 'users') {
    results.users = await User.find(query).select('-password')
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? Infinity : parseInt(limit));
  }
  if (type === 'all' || type === 'shops') {
    results.shops = await Shop.find({ ...query, uniqueId: q }) // Extra for uniqueId
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? Infinity : parseInt(limit));
  }
  if (type === 'all' || type === 'products') {
    results.products = await Product.find(query)
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? Infinity : parseInt(limit));
  }

  res.json({ success: true, results });
};
```

### 7. Analytics Controller (controllers/analytics.js)
```js
// src/controllers/analytics.js
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

export const getShopAnalytics = async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  const orders = await Order.find({ shop: shop._id });
  const reviews = await Review.find({ shop: shop._id });

  const stats = {
    views: shop.views.length, // Using array .length
    likes: shop.likes.length,
    shares: shop.shares,
    followersCount: shop.followers.length,
    orderCount: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
    reviewAvg: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0,
    // Add accesses (views), etc.
  };

  res.json({ success: true, stats });
};
```

### 8. Admin Controller (controllers/admin.js) - For reports/verification (already partial in shop)
```js
// src/controllers/admin.js
import Report from '../models/Report.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';

export const getReports = async (req, res) => {
  const reports = await Report.find({ status: 'pending' }).populate('reporter targetId');
  res.json({ success: true, reports });
};

export const resolveReport = async (req, res) => {
  await Report.findByIdAndUpdate(req.params.reportId, { status: 'resolved' });
  res.json({ success: true });
};

export const getUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, users });
};

// Seed admin (run as script)
export const seedAdmin = async (req, res) => {
  // Example: Create admin user if none
  res.json({ message: 'Admin seeded' });
};
```

### 9. Cron Utils (utils/cron.js) - New
```js
// src/utils/cron.js
import cron from 'cron';
import User from '../models/User.js';
import Cart from '../models/Cart.js';

const purgeJob = new cron.CronJob('0 0 * * *', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await User.deleteMany({ isActive: false, deactivationDate: { $lt: thirtyDaysAgo } });
  // Optional: Clean old carts (e.g., >90 days inactive)
  await Cart.deleteMany({ updatedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } });
});

export const startCron = () => purgeJob.start();
```

### 10. Mock Chats Controller/Routes (controllers/chat.js, routes/chat.js)
```js
// src/controllers/chat.js
export const getChats = (req, res) => {
  res.json({ success: true, chats: [], message: 'Chat disabled - mock' });
};
```

```js
// src/routes/chat.js
import express from 'express';
import { getChats } from '../controllers/chat.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getChats);

export default router;
```

### 11. Feed Controller (controllers/feed.js) - From earlier, adjusted for interests
```js
// src/controllers/feed.js
import Product from '../models/Product.js';

export const getFeed = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const user = await User.findById(req.user.id);

  const match = user.interests.length ? { tags: { $in: user.interests } } : {};

  const products = await Product.aggregate([
    { $match: match },
    { $addFields: { score: { $add: [{ $multiply: ['$views.length', 1] }, { $multiply: ['$likes.length', 2] }] } } }, // Adjusted for arrays
    { $sort: { score: -1 } },
    { $skip: all ? 0 : (page - 1) * limit },
    { $limit: all ? Infinity : parseInt(limit) },
  ]);

  res.json({ success: true, products });
};
```

### 12. Routes for New Features
```js
// src/routes/review.js
import express from 'express';
import { createReview, getReviews, deleteReview, reportReview } from '../controllers/review.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner, isReviewOwner } from '../middleware/owner.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.post('/shops/:shopId', authMiddleware, upload.single('photo'), createReview);
router.get('/shops/:shopId', getReviews); // Public-ish, but add auth if needed
router.delete('/:reviewId', authMiddleware, isReviewOwner, deleteReview);
router.post('/:reviewId/report', authMiddleware, reportReview);

export default router;
```

```js
// src/routes/search.js
import express from 'express';
import { search } from '../controllers/search.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, search);

export default router;
```

```js
// src/routes/analytics.js
import express from 'express';
import { getShopAnalytics } from '../controllers/analytics.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner } from '../middleware/owner.js';

const router = express.Router();
router.get('/shop/:shopId', authMiddleware, isShopOwner, getShopAnalytics);

export default router;
```

```js
// src/routes/admin.js
import express from 'express';
import { getReports, resolveReport, getUsers, seedAdmin } from '../controllers/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();
router.get('/reports', authMiddleware, isAdmin, getReports);
router.patch('/reports/:reportId/resolve', authMiddleware, isAdmin, resolveReport);
router.get('/users', authMiddleware, isAdmin, getUsers);
router.post('/seed-admin', seedAdmin); // Unprotected for initial setup

export default router;
```

```js
// src/routes/feed.js - New
import express from 'express';
import { getFeed } from '../controllers/feed.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getFeed);

export default router;
```

### 13. Update index.js
```js
// In src/index.js
import reviewRoutes from './routes/review.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import feedRoutes from './routes/feed.js';
import { startCron } from './utils/cron.js';
// ...
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/feed', feedRoutes);

// Start cron
startCron();
```

### 14. Testing
- Postman: Create review → Check shop rating updates.
- Search: GET /api/search?q=keyword → Results across types.
- Analytics: GET /api/analytics/shop/:shopId → Stats.
- Cron: Manually run purgeJob in console to test.
- Feed: GET /api/feed → Top products based on score.

Milestone: Engagement and admin features complete. Next: Phase 5 (Polish/Deployment). Test and let me know!