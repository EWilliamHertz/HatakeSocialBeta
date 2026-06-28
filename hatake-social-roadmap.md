# Hatake.Social Roadmap: Building an International TCG Community

To evolve Hatake.Social from a beta database into a thriving, world-class international Trading Card Game (TCG) community for collecting, trading, and playing, here is a comprehensive list of strategic improvements and features that need to be developed:

## 1. Global Marketplace & Trading (The Core Economy)
- **Direct Card-for-Card Trading System:** An interface where users can propose trades (e.g., my 2 Pikachus for your 1 Charizard) with an escrow system to prevent scams.
DONE
- **Integrated Payment Gateway:** Stripe/PayPal integration for secure buying/selling with localized currencies and automatic currency conversion.
DONE
- **Live Market Ticker:** A global dashboard showing the biggest daily price gainers and losers across all games (Magic, Pokemon, One Piece, etc.).
DONE
- **Shipping & Tracking Integration:** Allow users to buy/print shipping labels directly through the app to standardize international shipping.
- **Reputation & Review System:** A robust 5-star rating system for buyers and sellers, complete with dispute resolution and "Trusted Seller" badges.

## 2. Arena & Matchmaking (The Gaming Hub)
- **WebRTC Webcam Engine:** Build a built-in P2P video chat system specifically designed for spelltable-style remote webcam play.
- **Ranked Matchmaking System (Elo):** The "Arena Rating" needs a backend algorithm that updates based on wins/losses across different formats (Standard, Commander, Modern).
- **Tournaments & Leagues:** Automated bracket generation for user-hosted tournaments with entry fees and prize pools distributed in app-credits.
- **In-Browser Simulator (Future):** A sandbox digital tabletop where users can drag and drop digital representations of their collected cards to play without a webcam.

## 3. Social Connectivity & Community
- **Rich-Text Social Feed:** Upgrade the `/feed` with a rich-text editor supporting image uploads (via ImgBB), @mentions, #hashtags, and embedded decklists.
DONE
- **Guilds / Teams:** Allow users to form competitive or casual groups (e.g., "Tokyo Pokemon Masters" or "NY Commander Guild").
DONE
- **Real-Time Direct Messaging:** A persistent websocket-based chat widget (the "messenger widget") that can be toggled on/off, supporting direct messages and trade negotiations.
DONE
- **Multilingual Support (i18n):** Implement auto-translation for feed posts and allow users to toggle the site language between English, Japanese, Spanish, etc.
DONE

## 4. Advanced Collection Management
- **Image Recognition Scanner:** A mobile-friendly PWA feature utilizing the device camera to scan and automatically add cards to the collection via AI recognition.
DONE
- **Detailed Deck Builder:** A tool to construct decks from your "Have List," complete with mana-curve charts, probability calculators, and deck pricing.
DONE
- **Sealed Product Tracker:** Expand the Database to track Booster Boxes, ETBs, and Blister packs, tapping into APIs that track sealed product appreciation.
- **Condition Grading Pipeline:** Allow users to submit high-res photos of their cards for a community-driven "pre-grade" before sending them to PSA/Beckett.

## 5. Security & Infrastructure
- **Identity Verification:** KYC (Know Your Customer) integration for high-volume sellers to prevent fraud.
- **Socket.io Server:** Deploy a dedicated Node.js/Socket.io microservice to handle the real-time social feed, direct messaging, and Arena matchmaking without polling the database.
- **PWA Enhancements:** Fully implement Push Notifications for trade offers, direct messages, and outbid alerts.
