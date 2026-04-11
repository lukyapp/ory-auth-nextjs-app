# Ory Auth Next.js App

A Next.js authentication application that acts as both:

- the account experience for Ory self-service flows
- the login and consent UI for Hydra OAuth2/OIDC clients

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
- a running Ory Kratos instance
- a running Ory Hydra instance

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

4. Configure the local environment:
   - set `NEXT_PUBLIC_ORY_SDK_URL` to the public Kratos/browser URL exposed to this app
   - set `ORY_SDK_URL` to the server-side SDK URL used by Next.js server code
   - set `ORY_HYDRA_ADMIN_URL` to the Hydra admin URL
   - set `ORY_PROJECT_API_TOKEN` only if your setup requires it

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

The app currently validates these variables at startup:

```bash
NEXT_PUBLIC_ORY_SDK_URL=http://localhost:4433
ORY_SDK_URL=http://kratos:4433
ORY_HYDRA_ADMIN_URL=http://hydra:4445
ORY_PROJECT_API_TOKEN=optional
```

Notes:

- `NEXT_PUBLIC_ORY_SDK_URL` is used by browser-side Ory code
- `ORY_SDK_URL` is used by server-side Next.js code
- `ORY_HYDRA_ADMIN_URL` is used for Hydra login and consent challenge handling
- `ORY_PROJECT_API_TOKEN` is optional in the current validator
