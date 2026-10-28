# RideSync – Human-Oriented Ride-Hailing OS Synchronization Platform

**RideSync** is an interactive, authentic Uber/Ola-style ride booking web platform designed to demonstrate the classic **Operating System Producer-Consumer Problem**, **Bounded Buffer Synchronization**, **Counting Semaphores**, and **Mutex Locks**.

Built with a human-oriented, production-grade design suitable for college Operating Systems practical exams, vivas, and interactive demonstrations.

---

## 🌟 Metaphor & OS Concept Mapping

| OS Synchronization Concept | Ride-Hailing Metaphor | Role in Simulation |
| :--- | :--- | :--- |
| **Producer** | **Rider Booking App** (Aarav, Priya, Sneha) | Creates ride requests and enqueues them into the dispatch buffer. |
| **Consumer** | **Driver Partner Portal** (Amit, Rohan, Neha) | Accepts waiting ride requests and dequeues them (FIFO). |
| **Bounded Buffer** | **Shared Cloud Dispatch Queue** | Shared circular buffer with configurable capacity ($N = 3, 5, 7, 10$). |
| **Counting Semaphore `empty`** | **Available Dispatch Slots** | Initialized to $N$. Decremented by `wait(empty)`, incremented by `signal(empty)`. |
| **Counting Semaphore `full`** | **Waiting Ride Requests** | Initialized to $0$. Decremented by `wait(full)`, incremented by `signal(full)`. |
| **Binary Semaphore `mutex`** | **Dispatch Lock** | Initialized to $1$ (Unlocked). Ensures only 1 thread modifies the queue at a time. |

---

## 🚀 Key Interactive Human-Oriented Features

### 1. Interactive Uber/Ola Rider Booking Experience (Producer Side)
- **Passenger Profile Selector**: Choose from realistic passengers (Aarav Sharma ⭐4.95, Priya Patel ⭐4.92, Sneha Rao ⭐4.97, etc.).
- **Interactive Route Selector**: Pickup & Dropoff location inputs with connecting route track and swap button.
- **Popular Location Chips**: One-click quick routes (✈️ Airport T2, 🏢 Tech Park, 🎓 University, 🏥 Hospital, 🛍️ Mall).
- **Vehicle Class Selection**:
  - 🛵 **Moto / Bike** (1 seat • ₹65 • 2 min away)
  - 🛺 **Auto Rickshaw** (3 seats • ₹110 • 3 min away)
  - 🚗 **UberGo / Mini** (4 seats • ₹185 • 4 min away) - *Popular*
  - 🚙 **Premier Sedan** (4 seats • ₹260 • 5 min away)
- **Payment Method Selector**: UPI (GPay / PhonePe), Cash to Driver, RidePay Wallet.
- **Primary Action CTA**: "Request UberGo (Book Ride)" executing the exact producer semaphore sequence.

### 2. Interactive Driver Partner Portal (Consumer Side)
- **On Duty Status Toggle**: Live green beacon indicator.
- **Driver Profile Switcher**: Switch active driver (Amit Kumar - Swift Dzire ⭐4.92, Rohan Verma - Aura ⭐4.88, Neha Sharma - Auto ⭐4.97).
- **Incoming Ride Offers Radar**: Real-time dispatch radar showing the top waiting ride in the buffer with fare, route, and passenger rating.
- **Accept Ride Offer CTA**: Dequeues the oldest ride using consumer synchronization.
- **Driver Daily Payout Counter**: Live earnings tracking (₹1,420 + fares earned).

### 3. Interactive City GPS Radar Map (HTML5 Canvas)
- Dynamic street grid (Expressways, avenues, tech parks, airports, hospitals, metro hubs).
- Ambient moving driver cars with ratings (`Amit ⭐4.9`, `Rohan ⭐4.8`, `Neha ⭐4.95`).
- Visual broadcast sonar ripples when a ride is queued.
- Click anywhere on the map to select landmark pickup points.

### 4. Real-Time Trip Tracking Sheet (Modal)
- When a driver accepts a ride, displays a realistic trip confirmation card:
  - Driver photo, car model, plate number (`KA-01-AB-1234`).
  - **4-Digit Security PIN / OTP**: (e.g. `4892`).
  - Live 4-phase trip timeline (Request Placed ➔ Driver Assigned ➔ Driver Arriving ➔ Trip in Progress).
  - Fare total & interactive "Complete Trip" action.

### 5. Central Cloud Dispatch Buffer (Bounded Buffer Core)
- High-visibility Mutex lock banner with live lock/unlock state.
- Physical slot cards with Ride ID, passenger name, route, fare badge, and waiting status.
- Real-time Semaphores Monitor (`EMPTY`, `FULL`, `MUTEX`) with live counting values and OS formulas.

### 6. Interactive Concurrency Labs
- **Race Condition Lab**: Demonstrates what happens when two drivers accept the same ride without Mutex (double booking bug) vs with Mutex.
- **Deadlock Lab**: Demonstrates why lock order matters (`wait(empty)` before `wait(mutex)`).

### 7. Step-by-Step OS Debugger ("Step Mode")
- Advance through each of the 6 synchronization steps manually with the "Next Step" button.

### 8. Web Audio API Sound Synthesizer
- Authentic Uber/Ola booking chimes, driver offer pings, accept fanfare, and mutex latch clicks.

---

## 💻 How to Run Locally

Open `index.html` in any web browser or run with Python:

```bash
python -m http.server 8080
```

Then visit: `http://localhost:8080`
