# E-Commerce Admin Dashboard

A modern, feature-rich admin dashboard for managing your e-commerce platform. Built with React, TypeScript, Tailwind CSS, and ready to connect to Supabase.

## 🚀 Features

- **Modern UI/UX**: Beautiful gradient design with smooth animations
- **Dark/Light Mode**: Full theme support with toggle
- **Product Management**: Complete CRUD operations for products
- **Responsive Design**: Works perfectly on desktop and tablet
- **Supabase Ready**: Pre-configured client and schema files
- **Type-Safe**: Full TypeScript support

## 📋 Pages

1. **Dashboard**: Overview with quick stats and recent activity
2. **Products**: Full product management with table, search, filters, and forms
3. **Orders**: Order tracking and management (placeholder)
4. **Users**: Customer management (placeholder)
5. **Settings**: Configuration and preferences

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **State Management**: React Query
- **Backend**: Supabase (not connected)

## 📦 Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

5. Start the development server:
```bash
npm run dev
```

## 🗄️ Database Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Run the Schema

1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Execute the SQL script
4. Verify tables are created: `products`, `orders`, `users`

### 3. (Optional) Seed Data

1. Update the Supabase credentials in `seed.ts`
2. Run the seed script:
```bash
npx ts-node seed.ts
```

## 🔑 Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend-domain.com  # Backend API URL (required for user/product management)
```

Get these values from:
- Supabase Dashboard → Settings → API

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components (Sidebar, Header)
│   ├── products/         # Product-related components
│   └── ui/              # shadcn/ui components
├── pages/               # Page components
├── lib/                 # Utilities and Supabase client
└── index.css           # Global styles and design tokens
```

## 🎨 Design System

The dashboard uses a modern design system with:

- **Primary Color**: Purple gradient (`#8B5CF6` → `#3B82F6`)
- **Semantic Tokens**: All colors defined in `index.css`
- **Animations**: Smooth transitions and hover effects
- **Shadows**: Elegant shadows with glow effects

## 🔐 Security Notes

- Never commit `.env` to version control
- Keep your Supabase keys secure
- Review RLS policies before deployment
- Use environment variables for all secrets

## 📝 CRUD Operations

The `lib/supabase.ts` file includes helper functions:

### Products
- `productService.getProducts(filters?)` - Get all products
- `productService.getProduct(id)` - Get single product
- `productService.addProduct(product)` - Create new product
- `productService.updateProduct(id, updates)` - Update product
- `productService.deleteProduct(id)` - Delete product
- `productService.uploadImage(file)` - Upload product image

### Orders & Users
- `orderService.getOrders()` - Get all orders
- `userService.getUsers()` - Get all users

## 🚧 Roadmap

- [ ] Connect to live Supabase instance
- [ ] Implement real-time updates
- [ ] Add order management features
- [ ] Add user authentication
- [ ] Add analytics dashboard
- [ ] Add export functionality
- [ ] Add bulk operations

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email your-email@example.com or open an issue.

---

Built with ❤️ using React + Supabase
