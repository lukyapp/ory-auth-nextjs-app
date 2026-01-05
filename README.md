# Modern Authentication with Ory and Next.js

A secure authentication system built with Next.js and Ory Identity Platform, featuring modern UI components and best practices for user management.

## 🚀 Features

- **Secure Authentication** - Powered by Ory Identity Platform
- **Modern UI** - Built with Radix UI and Tailwind CSS
- **Full User Management** - Registration, login, password recovery, and email verification
- **Multi-language Support** - Internationalization with next-intl
- **Form Handling** - Robust form management with react-hook-form and Zod validation
- **Responsive Design** - Works seamlessly on all devices
- **Developer Experience** - TypeScript, ESLint, and Prettier configured

## 🛠 Tech Stack

- **Frontend Framework**: Next.js (App Router)
- **Authentication**: Ory Identity Platform
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: Radix UI, Lucide Icons, Hero Icons
- **Form Handling**: React Hook Form with Zod validation
- **Internationalization**: next-intl
- **Type Safety**: TypeScript
- **Testing**: React Testing Library
- **Package Manager**: pnpm

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Ory Cloud account (or self-hosted Ory Network)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ory-auth-nextjs-app.git
   cd ory-auth-nextjs-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and update the values:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your Ory project:
   - Create a new project at [Ory Console](https://console.ory.sh/)
   - Update the Ory-related environment variables in `.env.local`

5. Run the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗 Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   └── (app)/auth/           # Authentication pages
│       ├── consent/          # Consent page
│       ├── login/            # Login page
│       ├── registration/     # Registration page
│       ├── recovery/         # Password recovery
│       └── verification/     # Email verification
├── components/               # Reusable UI components
├── lib/                      # Utility functions and configurations
│   └── ory/                  # Ory client configuration
└── styles/                   # Global styles
```

## 🔍 Usage

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

### Environment Variables

For production deployment, make sure to set these required environment variables:

```
ORY_ACCESS_TOKEN=your_ory_access_token
ORY_PROJECT_SLUG=your_ory_project_slug
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```
