'use client';

/**
 * ShowcaseSection — polished app previews in browser chrome frames
 */

const showcaseApps = [
  {
    name: 'FitTrack Pro',
    description: 'Fitness coaching SaaS with subscription billing',
    borderColor: 'border-accent/20',
    bgAccent: 'bg-accent/5',
    features: ['User dashboard', 'Stripe subscriptions', 'Progress tracking'],
  },
  {
    name: 'BookLocal',
    description: 'Service marketplace with appointment scheduling',
    borderColor: 'border-accent-2/20',
    bgAccent: 'bg-accent-2/5',
    features: ['Provider profiles', 'Booking system', 'Payment processing'],
  },
  {
    name: 'MenuCraft',
    description: 'Restaurant ordering platform with delivery management',
    borderColor: 'border-success/20',
    bgAccent: 'bg-success/5',
    features: ['Online ordering', 'Menu management', 'Order tracking'],
  },
];

function BrowserFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-raised border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 ml-3">
          <div className="bg-base rounded-md px-3 py-1 text-xs text-fsvc-text-disabled max-w-xs">
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
    <section className="px-4 sm:px-6 py-20 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-center text-fsvc-text-secondary uppercase tracking-wider mb-4">
          What Gets Built
        </h2>
        <p className="text-center text-fsvc-text-disabled mb-12 max-w-2xl mx-auto">
          Real full-stack apps — not templates. Each one gets its own database, auth, payments, and deployment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showcaseApps.map((app) => (
            <BrowserFrame key={app.name} url={`${app.name.toLowerCase().replace(/\s/g, '')}.com`}>
              <div className={`rounded-lg ${app.bgAccent} border ${app.borderColor} p-4 min-h-[180px] flex flex-col justify-between`}>
                <div>
                  <h3 className="text-lg font-bold text-fsvc-text mb-1">{app.name}</h3>
                  <p className="text-xs text-fsvc-text-disabled mb-4">{app.description}</p>
                </div>
                <div className="space-y-1.5">
                  {app.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-xs text-fsvc-text-secondary">
                      <span className="text-accent-2">&#10003;</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </BrowserFrame>
          ))}
        </div>

        {/* Compact tech stack bar */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-fsvc-text-disabled">
          {[
            { label: 'Next.js 14', color: '#FF5C35' },
            { label: 'PostgreSQL', color: '#00C4A0' },
            { label: 'NextAuth.js', color: '#9A9A96' },
            { label: 'Stripe Connect', color: '#22C55E' },
            { label: 'Vercel', color: '#F0F0EE' },
            { label: 'Custom Email', color: '#F59E0B' },
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
