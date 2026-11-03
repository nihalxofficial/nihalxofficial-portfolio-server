/**
 * Seeds MongoDB with the portfolio's real content.
 *
 * Source of truth: the original `portfolio/data/portfolio.ts` file plus the
 * approved design copy. Everything here is editable later from the dashboard —
 * this script only bootstraps the database so the public site has real content
 * on first run.
 *
 * Run with: npm run seed
 */
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db";
import {
  AboutModel,
  BlogPostModel,
  CertificationModel,
  EducationModel,
  ExperienceModel,
  HeroModel,
  NavigationModel,
  ProjectModel,
  SectionModel,
  ServiceModel,
  SiteSettingsModel,
  SkillModel,
  StatisticModel,
  TestimonialModel,
} from "../models";

const showcase = (slug: string) => `/project-images/showcase/${slug}.png`;

const projects = [
  {
    title: "RentEase",
    slug: "rentease-property-rental",
    category: "Property Rental",
    shortDescription:
      "Stripe-powered property rental platform with tenant, owner and admin roles.",
    description:
      "A production-ready full-stack property rental and booking platform where tenants discover and book rentals, owners manage listings and bookings, and admins moderate the marketplace through dedicated role-based dashboards.",
    techStack: ["Next.js", "MongoDB", "Stripe", "Recharts", "Redis", "Docker"],
    features: [
      "Role-based dashboards for Tenant, Owner & Admin",
      "Advanced property search, filtering, pagination and favourites",
      "Booking system with Stripe payment integration",
      "Listing management with approval workflow",
      "Owner analytics dashboard with earnings charts",
      "Review and rating system",
    ],
    challenges:
      "Secure role-based authentication, complex booking and approval workflows, Stripe integration, property moderation, backend-driven search and filtering, dashboard analytics synchronisation.",
    improvements:
      "Real-time messaging, interactive property maps, availability calendar, AI recommendations, notification center and multilingual support.",
    liveUrl: "https://rentease-flash.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/RentEase-Client",
    thumbnailUrl: showcase("RentEase"),
    isFeatured: true,
    order: 1,
  },
  {
    title: "HireLoop",
    slug: "hireloop-job-marketplace",
    category: "Job Portal",
    shortDescription: "Job marketplace connecting seekers, recruiters and administrators.",
    description:
      "A production-ready full-stack job portal connecting job seekers, recruiters and administrators through role-based dashboards, smart job search, company management, subscription billing and complete recruitment workflows.",
    techStack: ["Next.js", "Express.js", "Stripe", "MongoDB", "Recharts", "JWT"],
    features: [
      "Role-based dashboards for Seeker, Recruiter & Admin",
      "Advanced job search with filters and saved jobs",
      "Application tracking with status updates",
      "Company registration and admin approval workflow",
      "Subscription plans with Stripe payments",
      "Recruiter applicant management with email notifications",
    ],
    challenges:
      "Scaling the role-based architecture, subscription billing, company approval states, dynamic dashboard data and search performance.",
    improvements:
      "Real-time messaging, AI job recommendations, resume parsing, interview scheduling and Redis caching.",
    liveUrl: "https://hireloop-client-theta.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/HireLoop-client",
    thumbnailUrl: showcase("HireLoop"),
    isFeatured: true,
    order: 2,
  },
  {
    title: "PetNest",
    slug: "petnest-pet-adoption-platform",
    category: "Pet Adoption",
    shortDescription: "Pet adoption portal connecting shelters and owners with adopters.",
    description:
      "PetNest connects animal lovers with shelters and individual pet owners. Visitors browse available pets, view detailed profiles and submit adoption requests, while owners manage listings and incoming requests.",
    techStack: ["Next.js", "Express.js", "Node.js", "MongoDB", "JWT", "Docker"],
    features: [
      "Advanced pet browsing and search",
      "Secure authentication with persistent sessions",
      "Adoption request workflow",
      "Comprehensive owner dashboard",
      "Protected and persistent routes",
      "Adoption control logic",
    ],
    challenges:
      "Persistent authentication, protected routes without redirect loops, adoption request state handling and duplicate approval prevention.",
    improvements:
      "Role-based operations, chat, AI recommendations, wishlists, location search and payments.",
    liveUrl: "https://petnest-olive.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/PetNest-Client",
    thumbnailUrl: showcase("PetNest"),
    isFeatured: true,
    order: 3,
  },
  {
    title: "Mentora",
    slug: "mentora-lms-platform",
    category: "Learning Platform",
    shortDescription: "Learning management system with student and instructor dashboards.",
    description:
      "A full-stack Learning Management System where students browse, enroll in and track courses while instructors create and manage educational content through a modern dashboard.",
    techStack: ["Next.js", "MongoDB", "Express.js", "JWT", "Docker", "Tailwind CSS"],
    features: [
      "Role-based dashboards for students and instructors",
      "Course browsing, enrollment and progress tracking",
      "Secure authentication with JWT",
      "Course management system",
    ],
    liveUrl: "https://mentora-lms-platform.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/Mentora-Client",
    thumbnailUrl: showcase("Mentora"),
    isFeatured: true,
    order: 4,
  },
  {
    title: "SunCart",
    slug: "suncart-summer-essentials-store",
    category: "E-Commerce",
    shortDescription: "Summer-focused e-commerce store with flash sales and social login.",
    description:
      "A modern summer-focused e-commerce platform featuring curated categories, flash sales, brand collections, authentication, advanced filtering and a smooth responsive shopping experience.",
    techStack: ["Next.js", "Tailwind CSS", "MongoDB", "Better Auth", "Swiper"],
    features: [
      "Flash sales with live countdown timers",
      "Advanced search, sorting and category filtering",
      "Secure authentication with social login",
      "Responsive UI with SEO optimization",
    ],
    liveUrl: "https://a8-suncart-pi.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/A8-SunCart",
    thumbnailUrl: showcase("SunCart"),
    order: 5,
  },
  {
    title: "PixGen",
    slug: "pixgen-ai-image-gallery",
    category: "AI Gallery",
    shortDescription: "AI image gallery with dynamic categories and social authentication.",
    description:
      "A full-stack AI image gallery where users explore, filter and view high-quality AI-generated artwork with secure authentication and a responsive UI.",
    techStack: ["Next.js", "Tailwind CSS", "MongoDB", "Better Auth", "React Icons"],
    features: [
      "Dynamic category filtering",
      "Detail pages using dynamic routing",
      "Google social login",
      "Loading and error states",
    ],
    liveUrl: "https://pixgen-wheat.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/PixGen-Ai-Image-Gallery",
    thumbnailUrl: showcase("PixGen"),
    order: 6,
  },
  {
    title: "Dragon News",
    slug: "dragon-news-portal",
    category: "News Portal",
    shortDescription: "News portal with category browsing and a live breaking-news ticker.",
    description:
      "A news portal delivering timely news with category browsing, social authentication, a live breaking news ticker and a responsive modern UI.",
    techStack: ["Next.js", "MongoDB Atlas", "DaisyUI", "Better Auth", "React Hook Form"],
    features: [
      "Category-based news browsing",
      "Live breaking news marquee",
      "Google and GitHub authentication",
      "Article ratings and view counts",
    ],
    liveUrl: "https://dragon-news-blush-eight.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/Dragon-News",
    thumbnailUrl: showcase("DragonNews"),
    order: 7,
  },
  {
    title: "App Store",
    slug: "app-store-downloading-platform",
    category: "App Directory",
    shortDescription: "App directory with real-time search and install management.",
    description:
      "A responsive app store where users browse apps by category, search in real time, install or uninstall apps and manage a personal installed-apps list.",
    techStack: ["Next.js", "React", "Tailwind CSS", "Vercel"],
    features: [
      "Real-time app search",
      "Category-based filtering",
      "Install and uninstall management",
      "Dynamic app detail pages",
    ],
    liveUrl: "https://next-app-store-tau.vercel.app",
    sourceUrl: "https://github.com/nihalxofficial/Next-app-store",
    thumbnailUrl: showcase("AppStore"),
    order: 8,
  },
  {
    title: "BookVibe",
    slug: "bookvibe-book-listing-tracking",
    category: "Reading Tracker",
    shortDescription: "Book listing and reading tracker with interactive statistics.",
    description:
      "A book listing and tracking application where users explore books, manage reading lists and visualise reading statistics through interactive charts.",
    techStack: ["React", "React Router", "DaisyUI", "Recharts"],
    features: [
      "Read list and wishlist management",
      "Interactive reading statistics",
      "Sortable books by rating and pages",
      "Detailed book information pages",
    ],
    liveUrl: "https://book-vibe-nihalxofficial.netlify.app",
    sourceUrl: "https://github.com/nihalxofficial/Book-Vibe",
    thumbnailUrl: showcase("BookVibe"),
    order: 9,
  },
];

const skills: Array<{
  name: string;
  category: string;
  icon: string;
  brandColor: string;
  proficiency: string;
  order: number;
}> = [
  { name: "React", category: "Tech Stack", icon: "SiReact", brandColor: "#61DAFB", proficiency: "advanced", order: 1 },
  { name: "Next.js", category: "Tech Stack", icon: "SiNextdotjs", brandColor: "#FFFFFF", proficiency: "expert", order: 2 },
  { name: "TypeScript", category: "Tech Stack", icon: "SiTypescript", brandColor: "#3178C6", proficiency: "advanced", order: 3 },
  { name: "JavaScript", category: "Tech Stack", icon: "SiJavascript", brandColor: "#F7DF1E", proficiency: "expert", order: 4 },
  { name: "Node.js", category: "Tech Stack", icon: "SiNodedotjs", brandColor: "#339933", proficiency: "advanced", order: 5 },
  { name: "Express", category: "Tech Stack", icon: "SiExpress", brandColor: "#C0C0C0", proficiency: "advanced", order: 6 },
  { name: "MongoDB", category: "Tech Stack", icon: "SiMongodb", brandColor: "#47A248", proficiency: "advanced", order: 7 },
  { name: "PostgreSQL", category: "Tech Stack", icon: "SiPostgresql", brandColor: "#4169E1", proficiency: "advanced", order: 8 },
  { name: "Prisma", category: "Tech Stack", icon: "SiPrisma", brandColor: "#5A67D8", proficiency: "familiar", order: 9 },
  { name: "Tailwind CSS", category: "Tech Stack", icon: "SiTailwindcss", brandColor: "#38BDF8", proficiency: "expert", order: 10 },
  { name: "HeroUI", category: "Tech Stack", icon: "SiHeroui", brandColor: "#005BC6", proficiency: "advanced", order: 11 },
  { name: "Socket.IO", category: "Tech Stack", icon: "SiSocketdotio", brandColor: "#25C2A0", proficiency: "familiar", order: 12 },
  { name: "Go", category: "Tech Stack", icon: "SiGo", brandColor: "#00ADD8", proficiency: "learning", order: 13 },
  { name: "Redis", category: "Tech Stack", icon: "SiRedis", brandColor: "#DC382D", proficiency: "familiar", order: 14 },
  { name: "Docker", category: "Tech Stack", icon: "SiDocker", brandColor: "#2496ED", proficiency: "advanced", order: 15 },
  { name: "Git", category: "Tech Stack", icon: "SiGit", brandColor: "#F05032", proficiency: "expert", order: 16 },
  { name: "Linux", category: "Tech Stack", icon: "SiLinux", brandColor: "#FCC624", proficiency: "familiar", order: 17 },
  { name: "Postman", category: "Tech Stack", icon: "SiPostman", brandColor: "#FF6C37", proficiency: "expert", order: 18 },
  { name: "Figma", category: "Other Tools", icon: "SiFigma", brandColor: "#F24E1E", proficiency: "advanced", order: 2 },
  { name: "GitHub", category: "Other Tools", icon: "SiGithub", brandColor: "#FFFFFF", proficiency: "expert", order: 3 },
  { name: "Vercel", category: "Other Tools", icon: "SiVercel", brandColor: "#FFFFFF", proficiency: "advanced", order: 4 },
  { name: "Render", category: "Other Tools", icon: "SiRender", brandColor: "#46E3B7", proficiency: "advanced", order: 5 },
  { name: "Neon", category: "Other Tools", icon: "SiNeon", brandColor: "#00E5BF", proficiency: "familiar", order: 6 },
  { name: "Docker Hub", category: "Other Tools", icon: "SiDocker", brandColor: "#2496ED", proficiency: "advanced", order: 7 },
];

const services = [
  {
    title: "Full-Stack Development",
    description:
      "End-to-end product development with React, Next.js and Node — performance-first, accessible and maintainable.",
    icon: "Code2",
    order: 1,
  },
  {
    title: "REST & API Engineering",
    description:
      "Layered Express APIs with validation, authentication, rate limiting and predictable response contracts.",
    icon: "Server",
    order: 2,
  },
  {
    title: "Database Design",
    description:
      "MongoDB and PostgreSQL schema design with indexing, aggregation pipelines and sensible data modelling.",
    icon: "Database",
    order: 3,
  },
  {
    title: "Performance Tuning",
    description:
      "Core Web Vitals, bundle splitting, caching and image optimization to keep interfaces fast.",
    icon: "Gauge",
    order: 4,
  },
  {
    title: "Responsive Interfaces",
    description:
      "Mobile-first layouts with a consistent design system across desktop, tablet and phone.",
    icon: "Smartphone",
    order: 5,
  },
  {
    title: "Docker & Deployment",
    description:
      "Production Docker images, compose orchestration and CI-friendly environment configuration.",
    icon: "Container",
    order: 6,
  },
];

async function seed() {
  await connectDatabase();
  // eslint-disable-next-line no-console
  console.log("[seed] connected");

  // The dashboard owns this data now, so the seed refuses to overwrite it
  // unless the operator explicitly asks for a reset.
  const reset = process.argv.includes("--reset");
  if (!reset) {
    const existing = await SiteSettingsModel.countDocuments();
    if (existing > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "[seed] content already exists — nothing was deleted.\n" +
          "       Re-run with `npm run seed -- --reset` to replace it.",
      );
      await mongoose.connection.close();
      return;
    }
  }

  await Promise.all([
    HeroModel.deleteMany({}),
    AboutModel.deleteMany({}),
    StatisticModel.deleteMany({}),
    SkillModel.deleteMany({}),
    ServiceModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    ExperienceModel.deleteMany({}),
    EducationModel.deleteMany({}),
    CertificationModel.deleteMany({}),
    NavigationModel.deleteMany({}),
    SectionModel.deleteMany({}),
    SiteSettingsModel.deleteMany({}),
    BlogPostModel.deleteMany({}),
    TestimonialModel.deleteMany({}),
  ]);

  await HeroModel.create({
    key: "main",
    greeting: "Hi, I'm",
    name: "Md. Nihal Uddin",
    highlightedName: "Bijoy",
    role: "Full-Stack Developer & Problem Solver",
    description:
      "I build modern web applications with clean code, beautiful UI and a passion for learning. Turning ideas into real-world products is what drives me.",
    availability: { label: "Available for remote work", isAvailable: true },
    primaryCta: { label: "View My Projects", href: "#projects" },
    secondaryCta: { label: "Download CV", href: "/Nihal_Full_Stack_Developer_Resume.pdf" },
    terminal: {
      command: "whoami",
      lines: [
        "Nihal Uddin Bijoy",
        "Full-Stack Developer (MERN)",
        "NEXT: learn Go, AI & System Design",
        "Building cool things...",
      ],
    },
    portraitUrl: "/portfolio/bijoy.png",
    // The role line is a typewriter — these phrases cycle in the hero banner.
    // Editable in the dashboard (Hero section). `prefix` is unused now.
    rotator: {
      prefix: "",
      lines: [
        "Full-Stack Developer & Problem Solver",
        "MERN & Next.js Developer",
        "UI-focused Web Engineer",
        "Backend & API Builder",
      ],
    },
    tagline: "Better Code, Better Tomorrow",
    order: 1,
  });

  await AboutModel.create({
    key: "main",
    label: "About Me",
    heading: "Who Am I?",
    paragraphs: [
      "I'm a Diploma student and a passionate web developer with experience in modern technologies. I enjoy solving problems, creating useful digital products, and constantly improving my skills.",
      "Currently, I'm working as a Frontend Developer Intern at bdsoft.org, and I'm always open to new opportunities, challenges and collaborations.",
    ],
    codeCard: {
      name: "Md. Nihal Uddin Bijoy",
      role: "Full-Stack Developer",
      location: "Mirsarai, Chattogram",
      education: "Diploma",
      experience: "Intern @ bdsoft.org",
      passion: ["Code", "Learn", "Build", "Grow"],
    },
    highlights: [
      { icon: "MapPin", label: "Location", value: "Mirsarai, Chattogram, Bangladesh" },
      { icon: "Mail", label: "Email", value: "mdnihaluddinbijoy@gmail.com" },
      { icon: "CircleDot", label: "Status", value: "Open to offers / Ready to interview" },
      { icon: "Laptop", label: "Work mode", value: "Remote work preferred (No onsite)" },
    ],
    signature: "Small steps, big dreams",
    order: 1,
  });

  await StatisticModel.insertMany([
    { value: "5+", label: "Projects Completed", description: "Shipped end to end", icon: "FolderCode", order: 1 },
    { value: "100+", label: "Hours of Learning", description: "Structured practice", icon: "Zap", order: 2 },
    { value: "∞", label: "Learning Never Stops", description: "Still a work in progress", icon: "Infinity", order: 3 },
  ]);

  await SkillModel.insertMany(skills);
  await ServiceModel.insertMany(services);
  await ProjectModel.insertMany(projects.map((project) => ({ ...project, isPublished: true })));

  await ExperienceModel.insertMany([
    {
      organization: "bdsoft.org",
      role: "Frontend Developer Intern",
      employmentType: "Internship",
      location: "Remote / Hybrid",
      startDate: "Jul 25, 2026",
      endDate: "Oct 25, 2026",
      isCurrent: true,
      status: "current",
      description:
        "Building production frontend features with React and Next.js, working alongside the product team on real client interfaces.",
      technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      order: 1,
    },
    {
      organization: "Feni Polytechnic Institute",
      role: "Mentor · FPI Computer Club",
      employmentType: "Mentorship",
      location: "Feni, Bangladesh",
      startDate: "Jan 2026",
      endDate: "Jun 2026",
      isCurrent: false,
      status: "completed",
      description:
        "Mentored fellow students through problem solving in Python, running hands-on sessions and reviewing members' code for the club.",
      technologies: ["Python", "Problem Solving", "Data Structures", "Git"],
      order: 2,
    },
  ]);

  await EducationModel.insertMany([
    {
      degree: "Diploma in Computer Science & Technology",
      institution: "Feni Polytechnic Institute",
      field: "Computer Science",
      period: "2025 – Present",
      description:
        "Studying core computer science with a focus on programming fundamentals, database systems and networking.",
      highlights: [
        "Web Development",
        "Database Management",
        "Computer Fundamentals",
        "Software Engineering",
      ],
      icon: "GraduationCap",
      order: 1,
    },
    {
      degree: "Complete Web Development",
      institution: "Programming Hero",
      field: "Full-Stack Development",
      period: "2026",
      description:
        "Comprehensive full-stack program covering React, Next.js, Node.js, databases and deployment.",
      icon: "BookOpen",
      order: 2,
    },
    {
      degree: "SSC — Science",
      institution: "J.B. High School",
      field: "Science",
      period: "2012 – 2016",
      description:
        "Completed SSC in the Science group with a foundation in mathematics, physics and chemistry.",
      icon: "School",
      order: 3,
    },
  ]);

  await CertificationModel.insertMany([
    { title: "Complete Web Development", issuer: "Programming Hero", year: "2026", icon: "LaptopCode", accentColor: "#3b82f6", order: 1 },
    { title: "Crash Course on Python", issuer: "Coursera", year: "2025", icon: "Code2", accentColor: "#3776AB", order: 2 },
    { title: "Database & SQL", issuer: "Coursera", year: "2025", icon: "Database", accentColor: "#f97316", order: 3 },
    { title: "Cyber Security & Professionals", issuer: "Web Origin", year: "2024", icon: "ShieldCheck", accentColor: "#22c55e", order: 4 },
    { title: "Web Design & Development", issuer: "DreamLand IT Institute", year: "2023", icon: "Paintbrush", accentColor: "#ec4899", order: 5 },
    { title: "Computer Office Application", issuer: "Post Office", year: "2022", icon: "Monitor", accentColor: "#0ea5e9", order: 6 },
  ]);

  await NavigationModel.insertMany([
    // isPrimary = pinned to the mobile bottom dock; the rest live in "More".
    // These five are the published navigation the design shows out of the box;
    // the rest ship hidden so the Navigation Manager can toggle them back on.
    { label: "Home", href: "#hero", icon: "Home", order: 1, isPrimary: true },
    { label: "About", href: "#about", icon: "User", order: 2 },
    { label: "Skills", href: "#skills", icon: "Wrench", order: 3 },
    { label: "Showcase", href: "#showcase", icon: "Rocket", order: 4, isPrimary: true },
    { label: "Contact", href: "#contact", icon: "Mail", order: 5, isPrimary: true },
    { label: "Projects", href: "#projects", icon: "FolderKanban", order: 6, isPrimary: true, isVisible: false },
    { label: "Experience", href: "#journey", icon: "Briefcase", order: 7, isVisible: false },
    { label: "Education", href: "#education", icon: "GraduationCap", order: 8, isVisible: false },
    { label: "Blog", href: "#blog", icon: "Newspaper", order: 9, isVisible: false },
  ]);

  await SectionModel.insertMany([
    { key: "hero", label: "Home", heading: "Hero", order: 1, isVisible: true },
    { key: "about", label: "About Me", heading: "Who Am I?", order: 2, isVisible: true },
    { key: "stats", label: "Numbers Speak", heading: "Numbers Speak", items: ["Get a full-time remote job", "Master DSA & System Design", "Contribute to open source", "Build something meaningful"], order: 3, isVisible: true },
    { key: "services", label: "Services", heading: "What I Do", order: 4, isVisible: true },
    { key: "skills", label: "Skills & Tools", heading: "Skills & Technologies", order: 5, isVisible: true },
    { key: "projects", label: "Projects", heading: "Featured Projects", order: 6, isVisible: true },
    { key: "showcase", label: "Showcase", heading: "Project Showcase", order: 7, isVisible: true },
    { key: "journey", label: "Experience", heading: "My Journey", order: 8, isVisible: true },
    { key: "education", label: "Education", heading: "Academic Background", order: 9, isVisible: true },
    { key: "certifications", label: "Certifications", heading: "Certifications", order: 10, isVisible: false },
    { key: "testimonials", label: "Testimonials", heading: "What People Say", order: 11, isVisible: false },
    { key: "blog", label: "Blog", heading: "Writing", order: 12, isVisible: false },
    { key: "contact", label: "Get In Touch", heading: "Let's Build Something Great Together", order: 13, isVisible: true },
  ]);

  await SiteSettingsModel.create({
    key: "main",
    siteName: "Md. Nihal Uddin Bijoy",
    siteUrl: "https://nihalxofficial.vercel.app",
    metaTitle: "Md. Nihal Uddin Bijoy — Full-Stack Developer",
    metaDescription:
      "Full-Stack Developer building modern web applications with React, Next.js, Node.js and MongoDB.",
    keywords: [
      "Md Nihal Uddin",
      "nihalxofficial",
      "Full-Stack Developer",
      "MERN Stack Developer",
      "Next.js Developer",
      "React",
      "Node.js",
      "MongoDB",
    ],
    ogImageUrl: "/og-image.jpg",
    branding: {
      navLogoLight: "",
      navLogoDark: "",
      footerLogoLight: "",
      footerLogoDark: "",
      // Empty favicon lets the tab show the generated mark tile ("NB").
      faviconUrl: "",
      logoAlt: "Md. Nihal Uddin Bijoy",
      mark: "NB",
      wordmark: "nihalxofficial",
    },
    typography: {
      sans: "outfit",
      display: "space-grotesk",
      mono: "jetbrains-mono",
    },
    contact: {
      email: "mdnihaluddinbijoy@gmail.com",
      location: "Mirsarai, Chattogram, Bangladesh",
      availability: "Open to offers / Ready to interview",
      // Empty coordinates make the contact map geocode the location text.
      mapLat: "",
      mapLng: "",
      mapZoom: 12,
      mapEmbedUrl: "",
    },
    socialLinks: [
      { platform: "GitHub", url: "https://github.com/nihalxofficial", icon: "Github" },
      { platform: "LinkedIn", url: "https://www.linkedin.com/in/md-nihal-uddin/", icon: "Linkedin" },
      { platform: "Docker Hub", url: "https://hub.docker.com/u/nihalxofficial", icon: "Container" },
      // Extra profiles: edit or add more from Control Centre → Site settings.
      // { platform: "Facebook", url: "", icon: "SiFacebook" },
      // { platform: "Twitter / X", url: "", icon: "SiX" },
      // { platform: "WhatsApp", url: "", icon: "SiWhatsapp" },
      // { platform: "Discord", url: "", icon: "SiDiscord" },
      // { platform: "LeetCode", url: "", icon: "SiLeetcode" },
      // { platform: "Stack Overflow", url: "", icon: "SiStackoverflow" },
    ],
    resumeUrl: "/Nihal_Full_Stack_Developer_Resume.pdf",
  });

  const counts = {
    hero: await HeroModel.countDocuments(),
    projects: await ProjectModel.countDocuments(),
    skills: await SkillModel.countDocuments(),
    experience: await ExperienceModel.countDocuments(),
    education: await EducationModel.countDocuments(),
    certifications: await CertificationModel.countDocuments(),
    sections: await SectionModel.countDocuments(),
  };

  // eslint-disable-next-line no-console
  console.log("[seed] done:", counts);

  await disconnectDatabase();
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed:", error);
  await mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
