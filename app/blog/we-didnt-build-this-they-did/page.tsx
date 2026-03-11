import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "We Didn't Build This. They Did. | FullStackVibeCoder Blog",
  description:
    "A real thank you to the OG coders, hackers, and rebels who broke things so we could build things. The people who paved the road every vibe coder now drives on.",
  keywords:
    "OG coders, open source heroes, Dennis Ritchie, Linus Torvalds, Tim Berners-Lee, Aaron Swartz, vibe coding history, software history",
  openGraph: {
    title: "We Didn't Build This. They Did.",
    description:
      "A debt letter to the punks, obsessives, and builders who stayed up all night so the rest of us could sleep through the stack.",
    type: "article",
    authors: ["Ara Mamourian"],
    publishedTime: "2025-03-11",
    tags: ["culture", "open source", "history", "tribute"],
  },
  twitter: {
    card: "summary_large_image",
    title: "We Didn't Build This. They Did.",
    description:
      "A debt letter to the punks, obsessives, and builders who stayed up all night so the rest of us could sleep through the stack.",
  },
  alternates: {
    canonical:
      "https://fullstackvibecoder.com/blog/we-didnt-build-this-they-did",
  },
};

interface PersonCardProps {
  name: string;
  handle: string;
  children: React.ReactNode;
  tags: Array<{ label: string; color: string }>;
  accent: string;
}

function PersonCard({ name, handle, children, tags, accent }: PersonCardProps) {
  return (
    <div
      className="bg-[#111] border border-[#222] p-8 my-8 relative"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="font-bold text-xl text-white mb-1">{name}</div>
      <div className="font-mono text-xs text-gray-500 tracking-wide mb-4">
        {handle}
      </div>
      <div className="space-y-4 text-[15px] text-gray-300 leading-relaxed">
        {children}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border"
            style={{ color: tag.color, borderColor: tag.color }}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WeDidntBuildThisBlogPost() {
  return (
    <article className="blog-post-page">
      <div className="blog-post-container">
        <header className="blog-post-header">
          <div className="blog-post-meta">
            <Link href="/blog" className="blog-back-link">
              &larr; Back to Blog
            </Link>
            <span className="blog-post-category">Culture &amp; Craft</span>
            <time className="blog-post-date">March 11, 2025</time>
            <span className="blog-post-reading">11 min read</span>
          </div>

          <h1 className="blog-post-title">
            We Didn&apos;t Build This. <span className="text-accent">They Did.</span>
          </h1>

          <p className="blog-post-lead border-l-2 border-purple-500 pl-5 italic text-gray-400">
            A debt letter to the punks, the obsessives, and the builders who
            stayed up all night so the rest of us could sleep through the stack.
            No companies. No IPOs. Just people.
          </p>

          <div className="blog-post-meta mt-4">
            By <span className="text-white">Ara Mamourian</span> &middot;
            FullStackVibeCoder &middot; <span className="text-white">2025</span>
          </div>
        </header>

        <div className="blog-post-content">
          <section className="blog-section">
            <p>
              Let me be clear about what I am. I&apos;m a third-career founder
              who learned to code with the help of AI, a keyboard, and the
              accumulated work of people I&apos;ve never met. I didn&apos;t go
              to computer science school. I didn&apos;t grind assembly in a
              terminal at 3am in 1987. I showed up late to a party that was
              already built, furnished, and running on electricity that other
              people wired.
            </p>

            <p>
              This post isn&apos;t about humility for its own sake. It&apos;s
              about accuracy. The tools I use every day, the languages, the
              runtimes, the protocols, the idea that software should be free to
              share and modify, none of that came from a boardroom. It came from
              individual human beings who were either angry enough, curious
              enough, or principled enough to build something and then hand it to
              everyone for free.
            </p>

            <p>
              Some of them got famous. Most didn&apos;t. All of them deserve to
              be named.
            </p>
          </section>

          <div className="border-y border-[#222] py-10 my-12 text-center">
            <p className="text-xl italic text-white max-w-xl mx-auto leading-relaxed">
              &ldquo;The road we&apos;re driving on was paved by people who had
              nothing to gain from paving it.&rdquo;
            </p>
          </div>

          {/* ── 01 / The Ground Floor ── */}
          <section className="blog-section">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gray-500 mt-16 mb-2">
              01 / The Ground Floor
            </div>
            <h2>The People Who Built the Bedrock</h2>

            <p>
              Before frameworks, before cloud functions, before npm install,
              someone had to write the operating system. Someone had to design
              the language. Someone had to decide that a computer could
              understand C. These are those people.
            </p>

            <PersonCard
              name="Dennis Ritchie & Ken Thompson"
              handle="Bell Labs, 1969-1972  ·  C Language + Unix"
              accent="#ff2d6b"
              tags={[
                { label: "C Language", color: "#ff2d6b" },
                { label: "Unix", color: "#00f0c8" },
                { label: "OS Architecture", color: "#39ff14" },
              ]}
            >
              <p>
                Ken Thompson built Unix in 1969, originally on a scavenged
                PDP-7, in part because he wanted to keep playing a space travel
                game. That&apos;s real. Dennis Ritchie built C to write Unix
                better. Together, they created the operating system architecture
                and programming language that every modern OS, Linux, macOS,
                Android, traces a direct line back to.
              </p>
              <p>
                C is still running in your kernel right now. Unix&apos;s design
                philosophy, small tools, composable, doing one thing well, is
                the same philosophy modern microservices are trying to
                rediscover. They figured it out in 1969.
              </p>
              <p>
                Dennis Ritchie died in 2011. He got almost no coverage. Steve
                Jobs died the same week.
              </p>
            </PersonCard>

            <PersonCard
              name="Richard Stallman"
              handle="MIT AI Lab → GNU Project, 1983  ·  Free Software Foundation"
              accent="#00f0c8"
              tags={[
                { label: "GNU", color: "#f5a623" },
                { label: "GPL / Copyleft", color: "#ff2d6b" },
                { label: "Free Software Foundation", color: "#9b5de5" },
              ]}
            >
              <p>
                In 1980, Stallman was refused the source code for a printer
                driver. That&apos;s it. That&apos;s the origin story of the
                entire free software movement. He decided that locked-down
                software was a moral problem, not just an inconvenience.
              </p>
              <p>
                He launched GNU in 1983 to build a completely free
                Unix-compatible operating system. He invented the GPL, the
                copyleft license that said: you can use this, modify it,
                distribute it, but you cannot close it. You cannot take what was
                given freely and make it private. That legal mechanism is the
                foundation that made open source economically survivable.
              </p>
              <p>
                He&apos;s complicated. He&apos;s often wrong about things.
                He&apos;s also the reason that Linux could legally exist and that
                billions of dollars of software is built on code that can never
                be locked up.
              </p>
            </PersonCard>

            <PersonCard
              name="Linus Torvalds"
              handle="Helsinki, 1991  ·  Linux Kernel"
              accent="#9b5de5"
              tags={[
                { label: "Linux", color: "#00f0c8" },
                { label: "Git", color: "#39ff14" },
                { label: "Open Source Culture", color: "#ff2d6b" },
              ]}
            >
              <p>
                He was 21 years old and announced his new OS on a mailing list
                with the line:{" "}
                <em>
                  &ldquo;I&apos;m doing a (free) operating system (just a
                  hobby, won&apos;t be big and professional like
                  gnu).&rdquo;
                </em>{" "}
                That hobby now runs 97% of the world&apos;s supercomputers, most
                of the internet&apos;s servers, and every Android device on the
                planet.
              </p>
              <p>
                He also built Git in 2005, in two weeks, because he was
                frustrated with the existing version control options. Git is the
                foundation of GitHub, every CI/CD pipeline, every collaborative
                codebase in the world. One person. Two foundational
                technologies. Both free.
              </p>
            </PersonCard>
          </section>

          {/* ── 02 / The Web ── */}
          <section className="blog-section">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gray-500 mt-16 mb-2">
              02 / The Web
            </div>
            <h2>
              The People Who Built the Internet You&apos;re Reading This On
            </h2>

            <p>
              The internet existed before the web. ARPANET, email, file
              transfer. But the web, the thing where you click a link and a page
              appears, that was a choice made by one person who could have
              patented it and didn&apos;t.
            </p>

            <PersonCard
              name="Tim Berners-Lee"
              handle="CERN, 1989  ·  HTTP + HTML + The World Wide Web"
              accent="#39ff14"
              tags={[
                { label: "HTTP", color: "#00f0c8" },
                { label: "HTML", color: "#ff2d6b" },
                { label: "World Wide Web", color: "#f5a623" },
              ]}
            >
              <p>
                He invented HTTP, HTML, and the URL system. He built the first
                web browser and the first web server. Then he gave the whole
                thing to the world, royalty-free, with no strings attached. His
                employers at CERN agreed to release the web into the public
                domain.
              </p>
              <p>
                He could have patented it. He&apos;s on record saying the web
                only works as a gift. There are very few decisions in the
                history of technology that changed the trajectory of
                civilization more than that one.
              </p>
            </PersonCard>

            <PersonCard
              name="Brendan Eich"
              handle="Netscape, 1995  ·  JavaScript"
              accent="#f5a623"
              tags={[
                { label: "JavaScript", color: "#39ff14" },
                { label: "The Browser Runtime", color: "#ff2d6b" },
              ]}
            >
              <p>
                JavaScript was written in ten days. Ten. And it was rushed out
                under pressure to compete with Java. It has inconsistencies,
                quirks, and behaviors that have driven developers to madness for
                thirty years. It is also the most widely deployed programming
                language in history, running in every browser on every device on
                earth.
              </p>
              <p>
                The chaos is baked in. The flexibility is what survived. Every
                web app you&apos;ve ever used, every React component, every Node
                server, every AI interface, JavaScript underneath. Built in ten
                days by one person under a deadline.
              </p>
            </PersonCard>
          </section>

          {/* ── 03 / The Language Builders ── */}
          <section className="blog-section">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gray-500 mt-16 mb-2">
              03 / The Language Builders
            </div>
            <h2>The People Who Made Code Human-Readable</h2>

            <PersonCard
              name="Guido van Rossum"
              handle="Netherlands, 1991  ·  Python"
              accent="#ff2d6b"
              tags={[
                { label: "Python", color: "#f5a623" },
                { label: "AI/ML Ecosystem", color: "#00f0c8" },
              ]}
            >
              <p>
                He wanted a language that was readable. Not just functional,
                readable. He designed Python with the explicit goal that code
                should look almost like English, that whitespace should be
                meaningful, that the language should make the right thing feel
                natural.
              </p>
              <p>
                Python is now the primary language for data science, machine
                learning, and AI. Every model, every dataset pipeline, every AI
                tool you&apos;re building on top of, Python is the glue. One
                person&apos;s belief that clarity matters.
              </p>
            </PersonCard>

            <PersonCard
              name="Yukihiro Matsumoto (Matz)"
              handle="Japan, 1995  ·  Ruby"
              accent="#00f0c8"
              tags={[
                { label: "Ruby", color: "#ff2d6b" },
                { label: "Developer Joy", color: "#9b5de5" },
              ]}
            >
              <p>
                His stated design goal was to make a language that made
                programmers <em>happy</em>. Not fast. Not powerful. Happy. He
                wanted programming to feel like natural language, like thinking
                out loud. He said the goal was to minimize friction between a
                programmer&apos;s thought and their code.
              </p>
              <p>
                Ruby gave us Rails. Rails is what made web development
                accessible to a generation of founders who could build full
                applications without an engineering team. That inheritance, Ruby
                &rarr; Rails &rarr; a generation of indie builders, is a direct
                ancestor of vibe coding culture.
              </p>
            </PersonCard>

            <PersonCard
              name="Rasmus Lerdorf"
              handle="Denmark / Canada, 1994  ·  PHP"
              accent="#9b5de5"
              tags={[
                { label: "PHP", color: "#39ff14" },
                { label: "Web Infrastructure", color: "#f5a623" },
              ]}
            >
              <p>
                He&apos;ll tell you he didn&apos;t write a programming language.
                He wrote some tools for his personal homepage and then kept
                adding to them. That&apos;s not modesty, that&apos;s actually
                how PHP started. He released it publicly and the internet
                grabbed it and didn&apos;t let go.
              </p>
              <p>
                At its peak, PHP powered 80% of the web. WordPress still runs
                on it. Facebook was built on it. It got mocked for years by
                developers who never stopped using it. Rasmus built the ugly
                workhorse that kept the whole machine running.
              </p>
            </PersonCard>
          </section>

          {/* ── 04 / The Rebels ── */}
          <section className="blog-section">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gray-500 mt-16 mb-2">
              04 / The Rebels
            </div>
            <h2>The People Who Fought for the Right to Share</h2>

            <PersonCard
              name="Aaron Swartz"
              handle="1986-2013  ·  RSS, Creative Commons, Reddit, Open Access"
              accent="#39ff14"
              tags={[
                { label: "RSS", color: "#ff2d6b" },
                { label: "Creative Commons", color: "#00f0c8" },
                { label: "Open Access", color: "#9b5de5" },
              ]}
            >
              <p>
                He co-authored the RSS specification at 14. Fourteen. He
                co-founded Reddit. He helped build Creative Commons, the
                licensing system that made it legal to share work freely on the
                internet.
              </p>
              <p>
                He believed, genuinely, not rhetorically, that knowledge locked
                behind paywalls was a form of violence against human potential.
                He fought for the idea that publicly funded research should be
                publicly accessible. He was prosecuted for downloading academic
                papers from a library database. He was 26 years old when he
                died.
              </p>
              <p>
                Every open-access paper, every freely shared dataset, every
                piece of public research you&apos;ve ever trained a model on,
                Aaron Swartz paid a price for that infrastructure.
              </p>
            </PersonCard>

            <PersonCard
              name="Ward Cunningham"
              handle="Portland, 1994  ·  The Wiki"
              accent="#f5a623"
              tags={[
                { label: "Wiki", color: "#f5a623" },
                { label: "Collaborative Knowledge", color: "#39ff14" },
              ]}
            >
              <p>
                He built the first wiki, WikiWikiWeb, in 1994 because he wanted
                a place where programmers could share and collaboratively edit
                design patterns. He named it after the Hawaiian word for
                &ldquo;quick.&rdquo; He made it open. Anyone could edit
                anything.
              </p>
              <p>
                That idea, that collaborative, public, editable knowledge is
                more valuable than controlled, private knowledge, became
                Wikipedia, Stack Overflow, GitHub wikis, and every shared
                knowledge base the internet runs on. The entire culture of open
                documentation traces back to one tool Ward Cunningham shipped in
                1994.
              </p>
            </PersonCard>

            <PersonCard
              name="Eric S. Raymond"
              handle='1997  ·  "The Cathedral and the Bazaar"'
              accent="#ff2d6b"
              tags={[
                { label: "Open Source Philosophy", color: "#ff2d6b" },
                { label: "The Bazaar Model", color: "#00f0c8" },
              ]}
            >
              <p>
                He wrote the essay that changed how the world thought about open
                source software. The central argument: software built openly, by
                many contributors, in public, the bazaar model, produces better
                software than software built in secrecy by a small team behind
                closed doors.
              </p>
              <p>
                That essay directly influenced Netscape&apos;s decision to open
                source their browser code in 1998. Which created Firefox. Which
                kept Microsoft from owning the entire web. The chain of
                consequence from a single essay is almost impossible to
                overstate.
              </p>
            </PersonCard>
          </section>

          {/* ── 05 / The Frame ── */}
          <section className="blog-section">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gray-500 mt-16 mb-2">
              05 / The Frame
            </div>
            <h2>What This Actually Means for Us</h2>

            <p>
              Every time I pull a package from npm, every time I spin up a
              Python environment, every time I push a commit to GitHub and
              Vercel auto-deploys my app, I&apos;m standing on a structure built
              by people who mostly got nothing for it. Not money. Not
              recognition. In some cases, not even respect.
            </p>

            <p>
              Dennis Ritchie&apos;s death got buried under Steve Jobs coverage.
              Aaron Swartz was prosecuted by a government that didn&apos;t
              understand what he&apos;d built or why it mattered. Richard
              Stallman has been arguing the same correct thing about software
              freedom for forty years while getting dismissed as a zealot.
              Rasmus Lerdorf built the language that ran the internet and has
              spent decades as the punchline of developer Twitter.
            </p>

            <p>
              Vibe coding, the ability to sit down, describe what you want, and
              have working software appear, exists because every foundational
              layer is open, documented, and free. That&apos;s not an accident.
              That&apos;s a choice made by specific people at specific moments
              who decided not to lock it down.
            </p>

            <p>We should say so. Out loud. More than once.</p>
          </section>

          <div className="border-y border-[#222] py-10 my-12 text-center">
            <p className="text-xl italic text-white max-w-xl mx-auto leading-relaxed">
              &ldquo;The best gift they gave us wasn&apos;t the code. It was the
              decision not to lock the door behind them.&rdquo;
            </p>
          </div>

          {/* ── Closing ── */}
          <div className="bg-[#161616] border border-[#222] p-10 mt-16">
            <h3 className="text-xl font-bold text-accent mb-4">
              // The real thank you
            </h3>
            <p className="text-[15px] text-gray-300 leading-relaxed mb-4">
              To Dennis Ritchie, Ken Thompson, Richard Stallman, Linus Torvalds,
              Tim Berners-Lee, Brendan Eich, Guido van Rossum, Yukihiro
              Matsumoto, Rasmus Lerdorf, Aaron Swartz, Ward Cunningham, Eric
              Raymond, and to every person whose name isn&apos;t on this list
              who committed code at midnight because the problem mattered:
            </p>
            <p className="text-[15px] text-gray-300 leading-relaxed mb-4">
              Thank you. Not as a formality. As a statement of fact. You built
              the road. We&apos;re driving on it.
            </p>
            <p className="text-[15px] text-gray-300 leading-relaxed">
              We will try not to waste it.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
