# 🏎️ Math Racing Tutor FS

> **Learn Math Through Racing!** A full-screen educational racing game that makes learning multiplication, division, and more feel like a thrilling race.

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Version](https://img.shields.io/badge/Version-0.1.0-blue)

---

## 🎯 Vision

Math Racing Tutor transforms the often tedious practice of math facts into an exhilarating racing experience. Students answer math problems to boost their car, competing against AI racers on a beautifully rendered track. The game adapts to any device - mobile, tablet, or desktop - ensuring a seamless learning experience anywhere.

---

## ✨ Key Features

### 🖥️ Universal Display
- **Fullscreen Track Rendering** - The racing track fills the entire viewport
- **Responsive Scaling** - Perfect display on any device or zoom level
- **Mobile-First Design** - Touch-friendly on phones and tablets

### 🏁 Racing HUD
- **Position Indicator** - Real-time race position (1st, 2nd, 3rd...)
- **Lap Timer** - Track your race time with precision
- **Speed Display** - See your current speed/boost level
- **Problem Counter** - Track math problems solved

### 📐 Based on MoeMath Design Philosophy
- **Direct to Action** - Start racing immediately
- **Visual Excellence** - Premium, modern aesthetics
- **Progressive Learning** - Difficulty adapts to skill level
- **Constructive Feedback** - Always know what to try next

---

## 🚀 Quick Start

```bash
# 1. Navigate to project
cd MathRacingTutorFS

# 2. Open in browser (no build required for v0.1)
# Simply open index.html in your browser

# OR use a local server
npx serve .
```

---

## 📁 Project Structure

```
MathRacingTutorFS/
├── index.html          # Main entry point
├── index.css           # Core styles
├── main.js             # Game logic
├── README.md           # This file
├── DesignPhilosophy.md # Design patterns & principles
├── TASKLIST.md         # Development progress
└── dist/
    └── assets/
        └── racing/
            ├── track_bg.png      # Racing track background
            ├── player_car.png    # Player vehicle
            ├── enemy_car_1.png   # AI opponent 1
            ├── enemy_car_2.png   # AI opponent 2
            ├── enemy_car_3.png   # AI opponent 3
            └── player_turbocar.png # Boosted player vehicle
```

---

## 🎨 Design Principles

Following the **MoeMath Design Philosophy**:

| Principle | Implementation |
|-----------|----------------|
| **Direct to Action** | Track loads immediately, ready to race |
| **Visual Excellence** | Vibrant HUD, smooth animations, premium feel |
| **Breathable Layout** | Clean HUD that doesn't obscure the track |
| **Responsive First** | Works on every screen size and orientation |
| **Progressive Disclosure** | Complex controls revealed only when needed |

---

## 🛠️ Development Phases

### Phase 1: Track Foundation (Current)
- [x] Perfect fullscreen track rendering
- [x] Responsive scaling system
- [x] HUD frame with position, time, speed
- [x] Cross-device compatibility

### Phase 2: Racing Mechanics
- [ ] Car movement and physics
- [ ] AI opponent behavior
- [ ] Collision detection
- [ ] Race start/finish logic

### Phase 3: Math Integration
- [ ] Problem generation system
- [ ] Answer input modal
- [ ] Boost reward system
- [ ] Difficulty progression

### Phase 4: Polish & Gamification
- [ ] Sound effects
- [ ] Victory celebrations
- [ ] Leaderboards
- [ ] Progress tracking

---

## 🖼️ Device Support

| Device | Orientation | Status |
|--------|-------------|--------|
| Desktop | Landscape | ✅ Optimized |
| Tablet | Landscape | ✅ Optimized |
| Tablet | Portrait | ✅ Adapted |
| Mobile | Landscape | ✅ Optimized |
| Mobile | Portrait | ⚠️ Landscape recommended |

---

## 📜 License

Educational use encouraged. Built with ❤️ for learners everywhere.

---

*Last Updated: February 2026*
