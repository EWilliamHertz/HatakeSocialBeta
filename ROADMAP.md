# Hatake.Social - Strategic Implementation Roadmap

**Date:** June 30, 2026  
**Status:** Beta Version  

---

## 🚀 PHASE 1: IMMEDIATE PRIORITIES (Months 1-3)
*Focus: Establishing the developer ecosystem, driving engagement, and finalizing core features.*

* [ ] **API Services & Hub Relocation:** 
  * Move the Multi-Game API Dashboard from "Resources" to `/apps`.
  * Launch API Services in Beta (Starter, Professional, Business, Enterprise tiers).
  * Build Developer Docs & sandbox environment.
* [ ] **Giveaway & Rewards System:** 
  * Implement Daily login bonuses, virtual currency ("Hatake Credits"), and loyalty tiers.
  * Allow creator-initiated & platform-sponsored giveaways.
* [x] **The "Ouyrie" MTG Client & "Euryx" Pokémon Client Integrations (Game Arena):** 
  * Hosts clients within Hatake's `/play/...` portals.
  * Navbars seamlessly hide during gameplay for true fullscreen immersion.
* [x] **In-Browser Simulator:** A sandbox digital tabletop where users can drag and drop digital representations of their collected cards to play without a webcam.
* [x] **TCGCSV Cron Sync:** Automated daily fetch of One Piece and Pokemon TCG master databases.
* [x] **Booster Pack Simulator:** True "Slot System" algorithm for cracking packs (MTG, Pokemon, Naruto).
* [x] **Unified Deck Builder & Collections:**
  * Paste-to-import bulk parsing for decklists natively connects to Hatake.Social backend.
  * Pricing algorithms correctly reflect FOIL, Condition multipliers, and Signatures instantly on portfolio.
* [x] **Universal Database Optimization:** Over 100k+ MTG/Pokémon records safely stored via stripped ultra-lean JSON payloads to preserve limits.
* [x] **Direct Card-for-Card Trading System:** An interface where users can propose trades with an escrow system.
* [x] **Integrated Payment Gateway:** Stripe/PayPal integration for secure buying/selling.
* [x] **Live Market Ticker:** A global dashboard showing the biggest daily price gainers and losers.
* [x] **Rich-Text Social Feed:** Upgrade the `/feed` with image uploads, @mentions, #hashtags, and embedded decklists.
* [x] **Guilds / Teams:** Allow users to form competitive or casual groups.
* [x] **Real-Time Direct Messaging:** Persistent websocket-based chat widget.
* [x] **Multilingual Support (i18n):** Auto-translation and site language toggles.
* [x] **Image Recognition Scanner:** Mobile-friendly PWA feature to scan and add cards.
* [x] **Detailed Deck Builder:** Tool to construct decks with mana-curve charts, probability, and pricing.

---

## 📈 PHASE 2: PLATFORM EXPANSION (Months 3-6)
*Focus: Monetization, marketplace tools, and modernization.*

* [ ] **Mobile Applications (Alpha/Beta):** 
  * Native iOS and Android apps with cross-platform sync.
* [ ] **Advanced Marketplace Features & Seller Tools:** 
  * Real-time socket-based bidding system for Marketplace Auctions.
  * Seller dashboard, bulk listing tools, and store customization.
* [ ] **Media & Rich Content Engine:** 
  * Image & Video uploads for posts (card pulls, tournament setups).
* [ ] **User Trust & Verification:** 
  * Seller/buyer ratings, reviews, and transaction history transparency (Trusted Seller badges).
* [ ] **Deck Builder Polish:** 
  * Drag-and-drop interface for constructing decks with curve analytics.
* [ ] **Shipping & Tracking Integration:** 
  * Allow users to buy/print shipping labels directly through the app to standardize international shipping.
* [ ] **Sealed Product Tracker:** 
  * Expand Database to track Booster Boxes, ETBs, and Blister packs.
* [ ] **Condition Grading Pipeline:** 
  * Submit high-res photos for a community-driven "pre-grade" before PSA/Beckett.

---

## ⚔️ PHASE 3: COMPETITIVE & ESPORTS INFRASTRUCTURE (Months 6-12)
*Focus: Tournaments, Guild mechanics, and Premium scaling.*

* [ ] **Guild Wars & Vaults:** 
  * Guild resource pooling, Guild vs Guild 5v5, and Global Elo Leaderboards.
* [ ] **Tournament Infrastructure:** 
  * Bracket generation (Swiss, single elimination).
  * Automated pairings, payout distribution, and prize tracking in app-credits.
* [ ] **Ranked Matchmaking System (Elo):** 
  * Backend algorithm that updates Arena Rating based on wins/losses across formats.
* [ ] **Game Clients (Beyond MTG & Pokémon):** 
  * Web-based game clients for One Piece TCG, Lorcana, and Naruto Mythos.
* [ ] **Premium Membership Tier (Hatake Premium):** 
  * Subscription options (€4.99 - €19.99/mo) for reduced marketplace fees and exclusive cosmetics.
* [ ] **Gamification & Cosmetics:** 
  * Unlockable profile banners, badges, achievements, and titles (e.g., "Hokage").

---

## 🌍 LONG-TERM VISIONS & R&D
* [ ] **Advanced Analytics Dashboards:** Market intelligence, portfolio valuation, tax lot tracking.
* [ ] **P2P Video Chat System:** Webcam-based WebRTC Arena matchmaking to play physical cards remotely.
* [ ] **PWA Push Notifications:** Live global notifications for trades, messages, and invites (WebSocket/Pusher).
* [ ] **Expanded B2B Portal:** Deep integration of API and Wholesale portals for retailers.
* [ ] **Identity Verification:** KYC (Know Your Customer) integration for high-volume sellers to prevent fraud.
* [ ] **Dedicated Socket.io Microservice:** Handle real-time social feed, messaging, and matchmaking efficiently.
