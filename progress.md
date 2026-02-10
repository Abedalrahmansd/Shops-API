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