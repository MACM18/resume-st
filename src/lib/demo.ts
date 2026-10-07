import type { Portfolio, Entry } from "./schema";
export const demoPortfolio: Portfolio = {
  name: "Sehani",
  position: "A curious mind. A thoughtful maker.",
  intro:
    "I turn little sparks of curiosity into meaningful work. Welcome to my corner of the internet — a collection of things I’ve made, learned, and loved.",
  about:
    "A little creativity, a lot of intention. I’m happiest when I’m exploring a new idea, bringing people together, or making something a little better than I found it.\n\nThis is a growing scrapbook of my work and the experiences shaping who I am.",
  location: "Sri Lanka",
  email: "",
  phone: "",
  portrait: "",
  resume: "",
  availability: "Open to new opportunities",
  available: true,
  socials: [],
  experience: [
    {
      title: "Your next chapter starts here",
      subtitle: "Add your experience in the dashboard",
      date: "YOUR JOURNEY",
      description:
        "A place for the roles, collaborations, and little milestones that matter.",
      hidden: false,
    },
  ],
  education: [],
  skills: [
    { title: "Creative thinking", hidden: false },
    { title: "Communication", hidden: false },
    { title: "Problem solving", hidden: false },
    { title: "Collaboration", hidden: false },
  ],
  seoTitle: "Sehani — My little corner of the internet",
  seoDescription:
    "A personal scrapbook of projects, ideas, and everyday curiosity.",
};
export const demoProjects: Entry[] = [
  {
    title: "Small ideas, meaningful impact",
    slug: "small-ideas",
    excerpt:
      "An example space for a project you’re proud of. Make it your own.",
    category: "PERSONAL PROJECT",
    date: "2026",
    role: "Creator",
    skills: "Ideas, Collaboration",
    featured: true,
    order: 0,
  },
  {
    title: "Made with a little curiosity",
    slug: "little-curiosity",
    excerpt:
      "Every good project starts with a question. This is where its story lives.",
    category: "COLLABORATION",
    date: "2026",
    role: "Collaborator",
    skills: "Research, Storytelling",
    featured: true,
    order: 1,
  },
].map((x) => ({
  ...x,
  body: "## A little beginning\nThis is demonstration content. Replace it with the real story of your project in the dashboard.\n\n## The process\nShare what you explored, the part you played, and what you learned.",
  cover: "",
  gallery: [],
  url: "",
  seoTitle: "",
  seoDescription: "",
}));
export const demoPost: Entry = {
  ...demoProjects[0],
  title: "A little space to begin again",
  slug: "a-little-space",
  category: "LIFE & LEARNING",
  excerpt:
    "On collecting ideas, following curiosity, and making room for what comes next.",
  body: "## Hello, little corner of the internet\nThis is a sample journal entry. Your stories, reflections, and learnings will find a home here.\n\nWrite something that sounds like you. The best place to start is wherever you are.",
  featured: false,
};
