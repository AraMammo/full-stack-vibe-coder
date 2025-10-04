# Full Stack Vibe Coder - Agency Website

A cutting-edge agency website built with Next.js, featuring chaotic cyberpunk aesthetics and interactive particle effects.

## 🚀 Features

- **Cyberpunk Design**: Dark theme with neon colors and glitch effects
- **Interactive Particles**: Canvas-based particle system with floating animations
- **Responsive Layout**: Works perfectly on desktop and mobile devices
- **Modern Tech Stack**: Built with Next.js 14, React 18, and TypeScript
- **Performance Optimized**: Fast loading with optimized animations

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: CSS with custom animations and effects
- **Effects**: Canvas API for particle animations

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Customization

### Colors
The website uses a cyberpunk color palette defined in `app/globals.css`:
- Primary Pink: `#ff0080`
- Neon Green: `#00ff88`
- Purple: `#8800ff`
- Orange: `#ffaa00`

### Content
Edit `app/page.tsx` to customize:
- Agency name and tagline
- Service descriptions
- Contact information
- Badge labels

### Animations
All animations are defined in `app/globals.css`:
- Glitch effects for the main title
- Floating text animations
- Particle system (JavaScript in page.tsx)
- Card hover effects

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms
Build the project and deploy the `out` folder:
```bash
npm run build
```

## 📱 Mobile Responsive

The website is fully responsive with:
- Flexible grid layouts
- Scalable typography
- Touch-friendly interactions
- Optimized animations for mobile

## 🎯 Services Showcase

The website showcases four main services:
1. **Full Stack Development** - Complete web applications
2. **UI/UX Design** - Beautiful user interfaces
3. **Digital Strategy** - Business growth planning
4. **Consulting** - Technical guidance

## 🔧 Performance

- Optimized animations with `requestAnimationFrame`
- Efficient particle system with cleanup
- CSS animations using GPU acceleration
- Minimal JavaScript bundle size

## 📄 License

This project is open source and available under the MIT License.

---

**Built with chaos, coded with love** ❤️
