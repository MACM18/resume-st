import { Flower } from "./flower";
import { AssetImage } from "./asset-image";
import Link from "next/link";
import { Download, MapPin, Sparkles, Sun } from "lucide-react";
import { PiSun, PiSmiley, PiStarFour, PiSunHorizon } from "react-icons/pi";
import type { Portfolio, Entry } from "@/lib/schema";
import { Reveal } from "./motion";
import { ContactForm } from "./contact-form";
import { RichText } from "./rich-text";
export function Header({ name = "Sehani" }: { name?: string }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
      {/* Name in First Letter Capital */}
        {name.charAt(0).toUpperCase() + name.slice(1)}
        <span aria-hidden="true">
          <PiSunHorizon />
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#about">About</Link>
        <Link href="/projects">My work</Link>
        <Link href="/blog">Journal</Link>
        <Link href="/#contact" className="nav-contact">
          Let’s talk
        </Link>
      </nav>
    </header>
  );
}
export function Footer({ name }: { name: string }) {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {name}. Made with a little sunshine.
      </span>
      <a href="https://macm.lk" target="_blank" rel="noopener noreferrer">
        Built by <strong>MACM.lk</strong>
      </a>
    </footer>
  );
}
export function DemoBanner() {
  return (
    <div className="demo-banner">
      A little preview · Sample name, copy & projects. Personalize everything in
      the dashboard.
    </div>
  );
}
export function Cover({ entry, index = 0 }: { entry: Entry; index?: number }) {
  return entry.cover ? (
    <AssetImage
      className="cover-image"
      id={entry.cover}
      fallback={entry.title}
      width={800}
      height={560}
      loading="lazy"
    />
  ) : (
    <div className={`project-art art-${index % 3}`} aria-hidden="true">
      {index % 3 === 0 ? (
        <>
          <div className="art-orbit" />
          <span className="art-small">GOOD THINGS START SMALL</span>
          <div className="art-poster">
            a little
            <br />
            <em>possibility.</em>
            <Flower className="poster-flower" />
          </div>
        </>
      ) : index % 3 === 1 ? (
        <>
          <div className="art-grid" />
          <div className="art-note">
            <span>notes to self</span>
            <p>
              Stay curious.
              <br />
              Make things.
              <br />
              <em>Keep growing.</em>
            </p>
            <span>
              <PiSun className="inline-icon" aria-hidden="true" />{" "}
              one idea at a time
            </span>
          </div>
          <PiStarFour className="art-star" aria-hidden="true" />
        </>
      ) : (
        <>
          <Sun size={90} strokeWidth={1} />
          <span className="journal-art-text">
            little thoughts,
            <br />
            <em>big beginnings.</em>
          </span>
        </>
      )}
    </div>
  );
}
export function ProjectCard({
  entry,
  index = 0,
}: {
  entry: Entry;
  index?: number;
}) {
  return (
    <Link className="project-card" href={`/projects/${entry.slug}`}>
      <div className="project-image">
        <Cover entry={entry} index={index} />
        <span className="card-cta">View project</span>
      </div>
      <div className="card-meta">
        <span>{entry.category || "SELECTED WORK"}</span>
        <span>{entry.date}</span>
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.excerpt}</p>
    </Link>
  );
}
export function Home({
  profile: p,
  projects,
  posts,
}: {
  profile: Portfolio;
  projects: Entry[];
  posts: Entry[];
}) {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className={`availability ${p.available ? "" : "quiet"}`}>
            <span />
            {p.availability || "Welcome to my portfolio"}
          </div>
          <p className="hand hello">
            Oh, hello there! <span>↴</span>
          </p>
          <h1>
            I’m{" "}
            <span className="name-highlight">
              {p.name}
              <svg
                viewBox="0 0 400 22"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M3 16 Q170 -2 397 12 M30 20 Q180 7 350 17" />
              </svg>
            </span>
            <span className="hero-dot">.</span>
          </h1>
          <h2>{p.position}</h2>
          <p className="hero-intro">{p.intro}</p>
          <div className="hero-actions">
            <Link href="/projects" className="button dark">
              Explore my work
            </Link>
            {p.resume ? (
              <span className="resume-links">
                <a
                  href={`/api/media/${p.resume}`}
                  target="_blank"
                  className="text-link"
                >
                  My résumé
                </a>
                <a
                  href={`/api/media/${p.resume}?download=1`}
                  aria-label="Download résumé"
                  className="icon-button"
                >
                  <Download size={15} />
                </a>
              </span>
            ) : (
              <a href="#about" className="text-link">
                A little about me
              </a>
            )}
          </div>
          <div className="hero-location">
            <MapPin size={14} />
            {p.location || "Somewhere, making things"}
            <span>•</span>
            <span>Always a work in progress</span>
          </div>
        </div>
        <div className="hero-collage">
          <span className="collage-note hand">
            a little sunshine,
            <br />a lot of possibility.
          </span>
          <span className="curved-arrow" aria-hidden="true">
            ⤵
          </span>
          <div className="portrait-frame">
            <span className="tape" />
            {p.portrait ? (
              <AssetImage
                id={p.portrait}
                fallback={`Portrait of ${p.name}`}
                width={640}
                height={760}
                fetchPriority="high"
              />
            ) : (
              <div className="portrait-placeholder">
                <div className="portrait-sun" />
                <div className="portrait-arch" />
                <div className="portrait-vase" />
                <div className="stem stem-one" />
                <div className="stem stem-two" />
                <Flower className="portrait-flower flower-one" />
                <Flower className="portrait-flower flower-two" />
                <span className="portrait-caption">
                  a place for your favorite photo
                </span>
              </div>
            )}
            <span className="hand photo-caption">
              finding joy in the little things{" "}
              <PiSmiley className="caption-icon" aria-hidden="true" />
            </span>
          </div>
          <div className="yellow-sticker">
            <Sparkles size={21} />
            <span>
              made of
              <br />
              little dreams
            </span>
          </div>
          <Flower className="collage-flower" />
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <span>A LITTLE CURIOSITY</span>
        <Flower />
        <span>A LOT OF HEART</span>
        <Flower />
        <span>ALWAYS LEARNING</span>
        <Flower />
        <span>MAKING THINGS MATTER</span>
        <Flower />
      </div>
      <section id="about" className="section wrap about-grid">
        <div>
          <span className="eyebrow">01 / THE PERSON BEHIND THE WORK</span>
          <h2>
            More than a<br />
            <span className="serif">little introduction.</span>
          </h2>
          <span className="hand yellow-scribble">
            Here’s a little of my story
          </span>
        </div>
        <div>
          <div className="about-text">
            <RichText value={p.about} compact />
          </div>
          {p.skills.some((s) => !s.hidden) && (
            <div className="skill-list">
              {p.skills
                .filter((s) => !s.hidden)
                .map((s, i) => (
                  <span key={i}>{s.title}</span>
                ))}
            </div>
          )}
          {p.socials.some((s) => !s.hidden) && (
            <div className="social-links">
              {p.socials
                .filter((s) => !s.hidden)
                .map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label}
                  </a>
                ))}
            </div>
          )}
        </div>
      </section>
      {projects.length > 0 && (
        <section className="section work-section">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">02 / MADE WITH INTENTION</span>
                <h2>
                  A few things
                  <br />
                  <span className="serif">I’ve put my heart into.</span>
                </h2>
              </div>
              <Link className="text-link" href="/projects">
                All my work
              </Link>
            </div>
            <div className="projects-grid">
              {projects
                .filter((p) => p.featured)
                .concat(projects.filter((p) => !p.featured))
                .slice(0, 2)
                .map((entry, i) => (
                  <Reveal key={entry.slug}>
                    <ProjectCard entry={entry} index={i} />
                  </Reveal>
                ))}
            </div>
          </div>
        </section>
      )}
      {(p.experience.some((x) => !x.hidden) ||
        p.education.some((x) => !x.hidden)) && (
        <section className="section wrap journey">
          <div>
            <span className="eyebrow">03 / GROWING ALONG THE WAY</span>
            <h2>
              The journey
              <br />
              <span className="serif">so far.</span>
            </h2>
            <Flower className="journey-flower" />
          </div>
          <div>
            {[
              { label: "Experience", rows: p.experience },
              { label: "Education", rows: p.education },
            ]
              .filter((g) => g.rows.some((r) => !r.hidden))
              .map((g) => (
                <div key={g.label} className="timeline-group">
                  <h3>{g.label}</h3>
                  {g.rows
                    .filter((r) => !r.hidden)
                    .map((r, i) => (
                      <div className="timeline-item" key={i}>
                        <span className="timeline-dot" />
                        <span className="eyebrow">{r.date}</span>
                        <h4>{r.title}</h4>
                        <span className="muted">{r.subtitle}</span>
                        <p>{r.description}</p>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section className="section wrap journal-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">04 / FROM MY NOTEBOOK</span>
              <h2>
                Little thoughts.<span className="serif"> Fresh pages.</span>
              </h2>
            </div>
            <Link href="/blog" className="text-link">
              The journal
            </Link>
          </div>
          {posts.slice(0, 3).map((post, i) => (
            <Link
              href={`/blog/${post.slug}`}
              className="journal-row"
              key={post.slug}
            >
              <span className="journal-number">0{i + 1}</span>
              <div>
                <span className="eyebrow">
                  {post.category || "NOTES & IDEAS"}
                </span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </div>
              <span className="row-cta">Read story</span>
            </Link>
          ))}
        </section>
      )}
      <section id="contact" className="contact-section">
        <div className="wrap contact-grid">
          <div>
            <span className="eyebrow">HAVE SOMETHING IN MIND?</span>
            <h2>
              Good things start
              <br />
              with a <span className="serif">hello.</span>
              <span className="hand" aria-hidden="true">
                <PiSun />
              </span>
            </h2>
            <p>
              An idea, an opportunity, or just a friendly wave.
              <br />
              I’d love to hear from you.
            </p>
            {p.email && (
              <a className="contact-email" href={`mailto:${p.email}`}>
                {p.email}
              </a>
            )}
            {p.phone && (
              <p>
                <a href={`tel:${p.phone.replace(/[^+0-9]/g, "")}`}>{p.phone}</a>
              </p>
            )}
            <span className="hand contact-note">
              Let’s make something lovely.
            </span>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
