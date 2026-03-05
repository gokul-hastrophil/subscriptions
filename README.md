# SubsTrack — Subscription Dashboard

A modern subscription management dashboard built with React + TypeScript + Vite.

## Features

- **Overview stats** — monthly cost, yearly projection, active count, upcoming renewals
- **Subscription cards** — per-card color accent, amount, billing cycle, next renewal badge
- **Add / Edit / Delete** subscriptions with a modal form
- **Toggle active/inactive** status per subscription
- **Search, filter** by category and status, **sort** by name, amount, renewal date, or category
- **Upcoming renewals** sidebar — highlights subscriptions renewing within 7 days
- **Category breakdown** with spend percentage bars
- **Persistent storage** via `localStorage`

## Getting Started

```bash
cd subscriptions-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output is placed in `subscriptions-app/dist/`.
