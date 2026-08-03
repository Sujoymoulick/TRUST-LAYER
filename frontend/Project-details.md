# 📁 Project Metadata & Architecture Blueprint

This document acts as a high-density schema mapping of the **Crifolayer** identity platform. It is designed to give AI developer models immediate, high-fidelity context on UI layouts, routing trees, backend services, dependencies, and styles.

> [!NOTE]
> Generated automatically by the **codebase-scanner-skill**. Run `node scanner-skill/scan.js` to rebuild this schema map.

---

## 🏗️ Directory Tree Structure
```text
├── 📂 **backend/**
│   ├── 📂 **config/**
│   │   ├── 📄 cloudinary.js *(1.1 KB)*
│   │   └── 📄 env.js *(1.6 KB)*
│   ├── 📂 **controllers/**
│   │   ├── 📄 adminController.js *(8.9 KB)*
│   │   ├── 📄 authController.js *(2.8 KB)*
│   │   ├── 📄 consentController.js *(5.8 KB)*
│   │   ├── 📄 developerController.js *(11.4 KB)*
│   │   ├── 📄 kycController.js *(14 KB)*
│   │   ├── 📄 oauthController.js *(16.3 KB)*
│   │   ├── 📄 oauthPlatformController.js *(6.9 KB)*
│   │   ├── 📄 passportController.js *(9.2 KB)*
│   │   ├── 📄 paymentController.js *(2 KB)*
│   │   ├── 📄 uploadController.js *(1.9 KB)*
│   │   ├── 📄 v1Controller.js *(8.3 KB)*
│   │   └── 📄 web3AuthController.js *(3.9 KB)*
│   ├── 📂 **db/**
│   │   ├── 📄 neo4j.js *(808 B)*
│   │   ├── 📄 prisma.js *(252 B)*
│   │   ├── 📄 prismaClientWrapper.js *(12.7 KB)*
│   │   └── 📄 supabase.js *(239 B)*
│   ├── 📂 **docs/**
│   │   └── 📄 openapi.yaml *(8.3 KB)*
│   ├── 📂 **middleware/**
│   │   ├── 📄 apiAuth.js *(1.7 KB)*
│   │   ├── 📄 apiRateLimiter.js *(2.8 KB)*
│   │   ├── 📄 apiSecurity.js *(4.5 KB)*
│   │   ├── 📄 auth.js *(3 KB)*
│   │   └── 📄 gatewayAuth.js *(6.3 KB)*
│   ├── 📂 **models/**
│   │   ├── 📄 ApiKey.js *(782 B)*
│   │   └── 📄 Feedback.js *(1.1 KB)*
│   ├── 📂 **prisma/**
│   │   └── 📄 schema.prisma *(5.4 KB)*
│   ├── 📂 **routes/**
│   │   ├── 📄 adminRoutes.js *(1.4 KB)*
│   │   ├── 📄 analyze.js *(1.7 KB)*
│   │   ├── 📄 api.js *(2.3 KB)*
│   │   ├── 📄 consent.js *(454 B)*
│   │   ├── 📄 developerRoutes.js *(1.2 KB)*
│   │   ├── 📄 feedback.js *(5.9 KB)*
│   │   ├── 📄 keys.js *(561 B)*
│   │   ├── 📄 kyc.js *(779 B)*
│   │   ├── 📄 oauth.js *(697 B)*
│   │   ├── 📄 oauthPlatformRoutes.js *(417 B)*
│   │   ├── 📄 passport.js *(340 B)*
│   │   ├── 📄 payment.js *(406 B)*
│   │   ├── 📄 upload.js *(406 B)*
│   │   ├── 📄 v1.js *(1.2 KB)*
│   │   └── 📄 web3Auth.js *(353 B)*
│   ├── 📂 **scripts/**
│   │   └── 📄 trust_engine.py *(3.2 KB)*
│   ├── 📂 **services/**
│   │   ├── 📄 crypto.js *(1.5 KB)*
│   │   ├── 📄 key.service.js *(427 B)*
│   │   ├── 📄 neo4j.service.js *(9.6 KB)*
│   │   ├── 📄 prismaScoringService.js *(8.9 KB)*
│   │   ├── 📄 secureVault.js *(2 KB)*
│   │   ├── 📄 socketService.js *(2.6 KB)*
│   │   ├── 📄 trustScoreService.js *(3.7 KB)*
│   │   └── 📄 webhookService.js *(2.3 KB)*
│   ├── 📄 .env *(230 B)*
│   ├── 📄 .env.example *(1 KB)*
│   ├── 📄 .gitignore *(396 B)*
│   ├── 📄 app.js *(23.3 KB)*
│   ├── 📄 index.js *(778 B)*
│   ├── 📄 package-lock.json *(78.1 KB)*
│   ├── 📄 package.json *(682 B)*
│   ├── 📄 README.md *(2.9 KB)*
│   └── 📄 render.yaml *(545 B)*
├── 📂 **frontend/**
│   ├── 📂 **sdk/**
│   │   ├── 📄 index.js *(5.5 KB)*
│   │   ├── 📄 package.json *(487 B)*
│   │   └── 📄 README.md *(3.9 KB)*
│   ├── 📂 **src/**
│   │   ├── 📂 **components/**
│   │   │   ├── 📂 **ui/**
│   │   │   │   ├── 📄 animated-characters-login-page.tsx *(23.6 KB)*
│   │   │   │   ├── 📄 button.tsx *(1.8 KB)*
│   │   │   │   ├── 📄 checkbox.tsx *(1 KB)*
│   │   │   │   ├── 📄 circular-testimonials.tsx *(9.1 KB)*
│   │   │   │   ├── 📄 demo.tsx *(3.1 KB)*
│   │   │   │   ├── 📄 input.tsx *(845 B)*
│   │   │   │   ├── 📄 label.tsx *(725 B)*
│   │   │   │   └── 📄 rocket-loader.tsx *(676 B)*
│   │   │   ├── 📄 AdminGuard.tsx *(1.7 KB)*
│   │   │   ├── 📄 AvatarUploader.tsx *(5.4 KB)*
│   │   │   ├── 📄 ConsentBanner.tsx *(6.4 KB)*
│   │   │   ├── 📄 ConsentVaultModal.tsx *(5.9 KB)*
│   │   │   ├── 📄 DigiLockerVerify.tsx *(5.5 KB)*
│   │   │   ├── 📄 GraphVisualization.tsx *(3.2 KB)*
│   │   │   ├── 📄 LoginWithTrustLayerButton.tsx *(1.9 KB)*
│   │   │   ├── 📄 PermissionsPanel.tsx *(13.4 KB)*
│   │   │   ├── 📄 SafetyMonitor.tsx *(3 KB)*
│   │   │   ├── 📄 TrustScore.tsx *(839 B)*
│   │   │   ├── 📄 TrustScoreCircle.tsx *(2.3 KB)*
│   │   │   ├── 📄 TurnstileWidget.tsx *(981 B)*
│   │   │   └── 📄 UPIPayment.tsx *(3.9 KB)*
│   │   ├── 📂 **context/**
│   │   │   ├── 📄 GuestContext.tsx *(657 B)*
│   │   │   └── 📄 ThemeContext.tsx *(1.1 KB)*
│   │   ├── 📂 **hooks/**
│   │   │   ├── 📄 useContractInteraction.ts *(1.2 KB)*
│   │   │   ├── 📄 useMessageSafety.ts *(978 B)*
│   │   │   ├── 📄 useProfileAvatar.ts *(4 KB)*
│   │   │   └── 📄 useSIWE.ts *(2.3 KB)*
│   │   ├── 📂 **layouts/**
│   │   │   └── 📄 DashboardLayout.tsx *(21.2 KB)*
│   │   ├── 📂 **lib/**
│   │   │   ├── 📄 api.ts *(1.6 KB)*
│   │   │   ├── 📄 crypto.ts *(946 B)*
│   │   │   ├── 📄 neo4j.ts *(734 B)*
│   │   │   ├── 📄 supabase.ts *(4.2 KB)*
│   │   │   └── 📄 utils.ts *(1.3 KB)*
│   │   ├── 📂 **pages/**
│   │   │   ├── 📄 Admin.tsx *(61.8 KB)*
│   │   │   ├── 📄 ApiDashboard.tsx *(26.2 KB)*
│   │   │   ├── 📄 ConnectedApps.tsx *(9.3 KB)*
│   │   │   ├── 📄 ConsentVault.tsx *(10.5 KB)*
│   │   │   ├── 📄 Dashboard.tsx *(36.6 KB)*
│   │   │   ├── 📄 Feedback.tsx *(27.4 KB)*
│   │   │   ├── 📄 Identity.tsx *(18.2 KB)*
│   │   │   ├── 📄 Landing.tsx *(15.9 KB)*
│   │   │   ├── 📄 Login.tsx *(24.4 KB)*
│   │   │   ├── 📄 Logout.tsx *(4.9 KB)*
│   │   │   ├── 📄 OauthConsent.tsx *(9.5 KB)*
│   │   │   ├── 📄 Passport.tsx *(21 KB)*
│   │   │   ├── 📄 PersonalKeys.tsx *(16.3 KB)*
│   │   │   ├── 📄 Pricing.tsx *(36.6 KB)*
│   │   │   ├── 📄 PublicProfile.tsx *(2.2 KB)*
│   │   │   ├── 📄 RiskAnalysis.tsx *(5.7 KB)*
│   │   │   ├── 📄 Settings.tsx *(9.4 KB)*
│   │   │   ├── 📄 VerificationCenter.tsx *(29.2 KB)*
│   │   │   └── 📄 WalletDashboard.tsx *(9.4 KB)*
│   │   ├── 📂 **providers/**
│   │   │   └── 📄 Web3Provider.tsx *(1.4 KB)*
│   │   ├── 📄 App.css *(64 B)*
│   │   ├── 📄 App.tsx *(3.2 KB)*
│   │   ├── 📄 index.css *(10.1 KB)*
│   │   └── 📄 main.tsx *(230 B)*
│   ├── 📄 .env *(694 B)*
│   ├── 📄 .env.example *(270 B)*
│   ├── 📄 .gitignore *(371 B)*
│   ├── 📄 eslint.config.js *(616 B)*
│   ├── 📄 index.html *(884 B)*
│   ├── 📄 package-lock.json *(413.4 KB)*
│   ├── 📄 package.json *(1.7 KB)*
│   ├── 📄 README.md *(1.8 KB)*
│   ├── 📄 SECURITY.md *(1.1 KB)*
│   ├── 📄 tsconfig.app.json *(718 B)*
│   ├── 📄 tsconfig.json *(119 B)*
│   ├── 📄 tsconfig.node.json *(591 B)*
│   ├── 📄 vercel.json *(214 B)*
│   └── 📄 vite.config.ts *(712 B)*
├── 📂 **scanner-skill/**
│   ├── 📄 README.md *(2 KB)*
│   └── 📄 scan.js *(11.7 KB)*
├── 📂 **sdk/**
│   ├── 📄 index.js *(5.5 KB)*
│   ├── 📄 package.json *(487 B)*
│   └── 📄 README.md *(3.9 KB)*
├── 📂 **src/**
│   ├── 📂 **components/**
│   │   ├── 📂 **ui/**
│   │   │   ├── 📄 animated-characters-login-page.tsx *(23.6 KB)*
│   │   │   ├── 📄 button.tsx *(1.8 KB)*
│   │   │   ├── 📄 checkbox.tsx *(1 KB)*
│   │   │   ├── 📄 circular-testimonials.tsx *(9.1 KB)*
│   │   │   ├── 📄 demo.tsx *(3.1 KB)*
│   │   │   ├── 📄 input.tsx *(845 B)*
│   │   │   ├── 📄 label.tsx *(725 B)*
│   │   │   └── 📄 rocket-loader.tsx *(676 B)*
│   │   ├── 📄 AdminGuard.tsx *(1.7 KB)*
│   │   ├── 📄 AvatarUploader.tsx *(5.4 KB)*
│   │   ├── 📄 ConsentBanner.tsx *(6.4 KB)*
│   │   ├── 📄 ConsentVaultModal.tsx *(5.9 KB)*
│   │   ├── 📄 DigiLockerVerify.tsx *(5.5 KB)*
│   │   ├── 📄 GraphVisualization.tsx *(3.2 KB)*
│   │   ├── 📄 LoginWithTrustLayerButton.tsx *(1.9 KB)*
│   │   ├── 📄 PermissionsPanel.tsx *(13.4 KB)*
│   │   ├── 📄 SafetyMonitor.tsx *(3 KB)*
│   │   ├── 📄 TrustScore.tsx *(839 B)*
│   │   ├── 📄 TrustScoreCircle.tsx *(2.3 KB)*
│   │   ├── 📄 TurnstileWidget.tsx *(981 B)*
│   │   └── 📄 UPIPayment.tsx *(3.9 KB)*
│   ├── 📂 **context/**
│   │   ├── 📄 GuestContext.tsx *(657 B)*
│   │   └── 📄 ThemeContext.tsx *(1.1 KB)*
│   ├── 📂 **hooks/**
│   │   ├── 📄 useContractInteraction.ts *(1.2 KB)*
│   │   ├── 📄 useMessageSafety.ts *(978 B)*
│   │   ├── 📄 useProfileAvatar.ts *(4 KB)*
│   │   └── 📄 useSIWE.ts *(2.3 KB)*
│   ├── 📂 **layouts/**
│   │   └── 📄 DashboardLayout.tsx *(18.5 KB)*
│   ├── 📂 **lib/**
│   │   ├── 📄 api.ts *(1.6 KB)*
│   │   ├── 📄 crypto.ts *(946 B)*
│   │   ├── 📄 neo4j.ts *(734 B)*
│   │   ├── 📄 supabase.ts *(4.2 KB)*
│   │   └── 📄 utils.ts *(1.3 KB)*
│   ├── 📂 **pages/**
│   │   ├── 📄 Admin.tsx *(61.8 KB)*
│   │   ├── 📄 ApiDashboard.tsx *(26.2 KB)*
│   │   ├── 📄 ConnectedApps.tsx *(9.3 KB)*
│   │   ├── 📄 ConsentVault.tsx *(10.5 KB)*
│   │   ├── 📄 Dashboard.tsx *(36.6 KB)*
│   │   ├── 📄 Feedback.tsx *(27.4 KB)*
│   │   ├── 📄 Identity.tsx *(18.2 KB)*
│   │   ├── 📄 Landing.tsx *(15.9 KB)*
│   │   ├── 📄 Login.tsx *(24.4 KB)*
│   │   ├── 📄 Logout.tsx *(4.9 KB)*
│   │   ├── 📄 OauthConsent.tsx *(9.5 KB)*
│   │   ├── 📄 Passport.tsx *(21 KB)*
│   │   ├── 📄 Pricing.tsx *(36.6 KB)*
│   │   ├── 📄 PublicProfile.tsx *(2.2 KB)*
│   │   ├── 📄 RiskAnalysis.tsx *(5.7 KB)*
│   │   ├── 📄 Settings.tsx *(9.4 KB)*
│   │   ├── 📄 VerificationCenter.tsx *(29.2 KB)*
│   │   └── 📄 WalletDashboard.tsx *(9.4 KB)*
│   ├── 📂 **providers/**
│   │   └── 📄 Web3Provider.tsx *(1.4 KB)*
│   ├── 📄 App.css *(64 B)*
│   ├── 📄 App.tsx *(3 KB)*
│   ├── 📄 index.css *(10.1 KB)*
│   └── 📄 main.tsx *(230 B)*
├── 📄 .env.example *(270 B)*
├── 📄 .gitignore *(371 B)*
├── 📄 eslint.config.js *(616 B)*
├── 📄 index.html *(884 B)*
├── 📄 institution_email_migration.sql *(611 B)*
├── 📄 package-lock.json *(413.4 KB)*
├── 📄 package.json *(1.7 KB)*
├── 📄 razorpay.env *(78 B)*
├── 📄 README.md *(1.8 KB)*
├── 📄 SECURITY.md *(1.1 KB)*
├── 📄 tsconfig.app.json *(718 B)*
├── 📄 tsconfig.json *(119 B)*
├── 📄 tsconfig.node.json *(591 B)*
├── 📄 vercel.json *(214 B)*
└── 📄 vite.config.ts *(712 B)*

```

---

## 📦 Dependencies & Ecosystem Breakdown

### Core Frameworks & Front-end Setup
*   **Vite React Setup**: Runs on modern **React 19** and **TypeScript** with Vite.
*   **Aesthetics Engine**: Built on Vanilla CSS (Tailwind v4 tokens integration) and **Framer Motion** for premium interactive animations.
*   **Key Web3 Providers**: Integrates **SIWE (Sign-In with Ethereum)**, **Wagmi**, **Viem**, and **RainbowKit** for decentralized Ethereum wallet connectivity.
*   **Security & Proofs**: Powered by **Cloudflare Turnstile** bot gates (`@marsidev/react-turnstile`) and **Sumsub Web SDK** (`@sumsub/websdk-react`) for identity proofs.

### Root Dependencies (Production & Tools)
| Package | Version |
| :--- | :--- |
| `@marsidev/react-turnstile` | `^1.5.2` |
| `@radix-ui/react-checkbox` | `^1.3.3` |
| `@radix-ui/react-label` | `^2.1.8` |
| `@radix-ui/react-slot` | `^1.2.4` |
| `@rainbow-me/rainbowkit` | `^2.2.11` |
| `@sumsub/websdk-react` | `^2.6.2` |
| `@supabase/supabase-js` | `^2.105.1` |
| `@tanstack/react-query` | `^5.100.9` |
| `@vercel/analytics` | `^2.0.1` |
| `@vercel/speed-insights` | `^2.0.0` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `framer-motion` | `^12.38.0` |
| `lucide-react` | `^1.16.0` |
| `qrcode.react` | `^4.2.0` |
| `react` | `^19.2.5` |
| `react-dom` | `^19.2.5` |
| `react-icons` | `^5.6.0` |
| `react-router-dom` | `^7.14.1` |
| `siwe` | `^3.0.0` |
| `tailwind-merge` | `^3.5.0` |
| `tw-animate-css` | `^1.4.0` |
| `viem` | `^2.23.5` |
| `vis-network` | `^10.0.2` |
| `wagmi` | `^2.14.9` |

### Frontend Packages (`frontend/package.json`)
| Package | Version |
| :--- | :--- |
| `@marsidev/react-turnstile` | `^1.5.2` |
| `@radix-ui/react-checkbox` | `^1.3.3` |
| `@radix-ui/react-label` | `^2.1.8` |
| `@radix-ui/react-slot` | `^1.2.4` |
| `@rainbow-me/rainbowkit` | `^2.2.11` |
| `@sumsub/websdk-react` | `^2.6.2` |
| `@supabase/supabase-js` | `^2.105.1` |
| `@tanstack/react-query` | `^5.100.9` |
| `@vercel/analytics` | `^2.0.1` |
| `@vercel/speed-insights` | `^2.0.0` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `framer-motion` | `^12.38.0` |
| `lucide-react` | `^1.16.0` |
| `qrcode.react` | `^4.2.0` |
| `react` | `^19.2.5` |
| `react-dom` | `^19.2.5` |
| `react-icons` | `^5.6.0` |
| `react-router-dom` | `^7.14.1` |
| `siwe` | `^3.0.0` |
| `tailwind-merge` | `^3.5.0` |
| `tw-animate-css` | `^1.4.0` |
| `viem` | `^2.23.5` |
| `vis-network` | `^10.0.2` |
| `wagmi` | `^2.14.9` |

### Backend Services (`backend/package.json`)
| Service Library | Version |
| :--- | :--- |
| `@prisma/client` | `^5.22.0` |
| `@supabase/supabase-js` | `^2.105.1` |
| `axios` | `^1.16.0` |
| `bcrypt` | `^6.0.0` |
| `cloudinary` | `^1.41.3` |
| `cors` | `^2.8.6` |
| `dotenv` | `^17.4.2` |
| `ethers` | `^6.16.0` |
| `express` | `^5.2.1` |
| `jsonwebtoken` | `^9.0.3` |
| `mongoose` | `^9.6.1` |
| `multer` | `^1.4.5-lts.1` |
| `multer-storage-cloudinary` | `^4.0.0` |
| `neo4j-driver` | `^6.0.1` |
| `siwe` | `^3.0.0` |
| `ws` | `^8.20.1` |

---

## 🚦 Frontend Routing Map (`App.tsx`)
The client app handles routing using `react-router-dom`. Here are the detected landing points and layouts:

| Path | Mounted View Component | Access Constraints |
| :--- | :--- | :--- |
| `/` | `Landing` | Public Access |
| `/login` | `Login` | Public Access |
| `/pricing` | `Pricing` | Public Access |
| `/profile` | `PublicProfile` | Public Access |
| `/logout` | `Logout` | Public Access |
| `/oauth/consent` | `OauthConsent` | Public Access |
| `/dashboard` | `Dashboard` | Public Access |
| `/verification-center` | `VerificationCenter` | Public Access |
| `/wallet` | `WalletDashboard` | 🔑 Standard User Login Required |
| `/identity` | `Identity` | Public Access |
| `/passport` | `Passport` | 🔑 Standard User Login Required |
| `/connected-apps` | `ConnectedApps` | Public Access |
| `/analytics` | `RiskAnalysis` | Public Access |
| `/api` | `Navigate` | Public Access |
| `/developer/portal` | `ApiDashboard` | 🔑 Standard User Login Required |
| `/developer/keys` | `PersonalKeys` | 🔑 Standard User Login Required |
| `/vault` | `ConsentVault` | 🔑 Standard User Login Required |
| `/admin` | `AdminGuard` | 👑 Admin Elite Role Restricted |
| `/settings` | `Settings` | Public Access |
| `/feedback` | `Feedback` | Public Access |
| `*` | `Navigate` | Public Access |

---

## ⚡ Backend Services & REST APIs
Here are the routes detected inside the main API entrypoint:

| HTTP Method | Route Endpoint | Purpose / Functionality |
| :--- | :--- | :--- |


---

## 🎨 Theme Tokens & Aesthetic Tokens
Crifolayer uses custom Neo-Brutalist CSS tokens mapped inside `index.css`:

| Variable Token | Resolved Style Code | Theme Context |
| :--- | :--- | :--- |
| `--font-display` | `'Archivo Black', sans-serif` | Global token |
| `--font-body` | `'Public Sans', sans-serif` | Global token |
| `--color-brutal-yellow` | `#FFE600` | Neo-Brutalism flat color accent |
| `--color-brutal-pink` | `#FF60B5` | Neo-Brutalism flat color accent |
| `--color-brutal-blue` | `#0057FF` | Neo-Brutalism flat color accent |
| `--color-brutal-green` | `#00FF00` | Neo-Brutalism flat color accent |
| `--color-brutal-navy` | `#0A1B3F` | Neo-Brutalism flat color accent |
| `--color-brutal-black` | `#000000` | Neo-Brutalism flat color accent |
| `--color-brutal-white` | `#FFFFFF` | Neo-Brutalism flat color accent |
| `--color-brutal-bg` | `#F5F5F5` | Theme backgrounds (dynamic light/dark) |
| `--color-neon-orange` | `#FF5F00` | Global token |
| `--bg-primary` | `#F5F5F5` | Theme backgrounds (dynamic light/dark) |
| `--text-primary` | `#000000` | Global token |
| `--text-secondary` | `#1A1A1A` | Global token |
| `--border-color` | `#000000` | Solid structural borders |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | Glassmorphism backdrop settings |
| `--glass-border` | `rgba(0, 0, 0, 0.2)` | Solid structural borders |
| `--shadow-color` | `rgba(0, 0, 0, 0.15)` | Global token |
| `--nav-bg` | `rgba(255, 255, 255, 0.9)` | Theme backgrounds (dynamic light/dark) |
| `--bg-primary` | `#050505` | Theme backgrounds (dynamic light/dark) |
| `--text-primary` | `#FFFFFF` | Global token |
| `--text-secondary` | `#9CA3AF` | Global token |
| `--border-color` | `rgba(255, 255, 255, 0.1)` | Solid structural borders |
| `--glass-bg` | `rgba(0, 0, 0, 0.4)` | Glassmorphism backdrop settings |
| `--glass-border` | `rgba(255, 255, 255, 0.1)` | Solid structural borders |
| `--shadow-color` | `rgba(0, 0, 0, 0.8)` | Global token |
| `--nav-bg` | `rgba(0, 0, 0, 0.4)` | Theme backgrounds (dynamic light/dark) |

---

## 🔍 Core Component Directory & Descriptions
Below is a high-level summary of vital UI building blocks:

1.  **[DashboardLayout.tsx](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/frontend/src/layouts/DashboardLayout.tsx)**: The main layout structure containing the side-navigation drawer, theme indicators, mobile tab elements, and Rainbowkit wallet connection buttons.
2.  **[PermissionsPanel.tsx](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/frontend/src/components/PermissionsPanel.tsx)**: Integrates standard granular toggle controls for privacy data sharing policies inside the Consent Vault.
3.  **[DigiLockerVerify.tsx](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/frontend/src/components/DigiLockerVerify.tsx)**: A modal that links external Indian government digital locker credentials to the user profile.
4.  **[GraphVisualization.tsx](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/frontend/src/components/GraphVisualization.tsx)**: Leverages `vis-network` to draw real-time interactive relational identity logs using direct Neo4j integrations.
5.  **[UPIPayment.tsx](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/frontend/src/components/UPIPayment.tsx)**: Processes standard mobile quick response scanning systems as a manual Razorpay fallback.

---
*Created by Crifolayer Skill Engine © 2026.*
