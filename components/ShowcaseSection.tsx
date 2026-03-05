'use client';

/**
 * ShowcaseSection — replaces the wireframe mockup with polished app previews
 * Uses browser chrome frames to display realistic-looking deployed apps.
 */

const showcaseApps = [
  {
    name: 'FitTrack Pro',
    description: 'Fitness coaching SaaS with subscription billing',
    gradient: 'from-pink-500/20 to-purple-500/20',
    borderColor: 'border-pink-500/30',
    features: ['User dashboard', 'Stripe subscriptions', 'Progress tracking'],
  },
  {
    name: 'BookLocal',
    description: 'Service marketplace with appointment scheduling',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/30',
    features: ['Provider profiles', 'Booking system', 'Payment processing'],
  },
  {
    name: 'MenuCraft',
    description: 'Restaurant ordering platform with delivery management',
    gradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
    features: ['Online ordering', 'Menu management', 'Order tracking'],
  },
];

function BrowserFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 ml-3">
          <div className="bg-white/10 rounded-md px-3 py-1 text-xs text-gray-500 max-w-xs">
            {url}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ShowcaseSection() {
  return (
    <section className="px-4 sm:px-6 py-20 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-400 uppercase tracking-wider mb-4">
          What Gets Built
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Real full-stack apps — not templates. Each one gets its own database, auth, payments, and deployment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showcaseApps.map((app) => (
            <BrowserFrame key={app.name} url={`${app.name.toLowerCase().replace(/\s/g, '')}.com`}>
              <div className={`rounded-lg bg-gradient-to-br ${app.gradient} p-4 min-h-[180px] flex flex-col justify-between`}>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{app.description}</p>
                </div>
                <div className="space-y-1.5">
                  {app.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="text-green-400">&#10003;</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </BrowserFrame>
          ))}
        </div>

        {/* Compact tech stack bar */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          {[
            { label: 'Next.js 14', color: '#ec4899' },
            { label: 'PostgreSQL', color: '#06b6d4' },
            { label: 'NextAuth.js', color: '#a855f7' },
            { label: 'Stripe Connect', color: '#22c55e' },
            { label: 'Vercel', color: '#3b82f6' },
            { label: 'Custom Email', color: '#eab308' },
          ].map((tech) => (
            <span key={tech.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tech.color }} />
              {tech.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
