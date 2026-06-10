// =============================================================================
// Intelligent Data Seeder for Job Application CRM
// =============================================================================
// This script creates realistic, demo-worthy data that makes the application
// feel like it has been used daily by a real candidate for ~10 months.
//
// Usage: node src/seed.js
// Login: test@example.com / password123
// Empty: empty@example.com / password123
// =============================================================================

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Job from "./models/Job.js";
import Company from "./models/Company.js";
import Resume from "./models/Resume.js";
import ActivityLog from "./models/ActivityLog.js";

dotenv.config();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a random integer between min (inclusive) and max (inclusive). */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick a random element from an array. */
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/** Pick N unique random elements from an array. */
const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};

/** Returns a Date offset by `days` from `base`. */
const addDays = (base, days) => new Date(base.getTime() + days * 86400000);

/** Returns a Date offset by `hours` from `base`. */
const addHours = (base, hours) => new Date(base.getTime() + hours * 3600000);

// ─── Reference Data ──────────────────────────────────────────────────────────

const STATUSES = ["Wishlist", "Applied", "OA", "Screening", "Technical", "HR", "Offer", "Rejected"];
const SOURCES = ["LinkedIn", "Naukri", "Referral", "Career Page", "Indeed", "Internshala", "Other"];
const PRIORITIES = ["Low", "Medium", "High"];

// Realistic company definitions with industry, location, and career page
const COMPANY_DEFS = [
  // ── FAANG / Big Tech ──
  { name: "Google", industry: "Technology", location: "Bangalore, India", website: "https://about.google", careerPage: "https://careers.google.com" },
  { name: "Amazon", industry: "E-commerce", location: "Hyderabad, India", website: "https://amazon.com", careerPage: "https://amazon.jobs" },
  { name: "Microsoft", industry: "Technology", location: "Noida, India", website: "https://microsoft.com", careerPage: "https://careers.microsoft.com" },
  { name: "Meta", industry: "Social Media", location: "Gurugram, India", website: "https://meta.com", careerPage: "https://metacareers.com" },
  { name: "Apple", industry: "Consumer Electronics", location: "Hyderabad, India", website: "https://apple.com", careerPage: "https://jobs.apple.com" },
  { name: "Netflix", industry: "Entertainment", location: "Remote", website: "https://netflix.com", careerPage: "https://jobs.netflix.com" },

  // ── Unicorns / High-growth ──
  { name: "Stripe", industry: "FinTech", location: "Bangalore, India", website: "https://stripe.com", careerPage: "https://stripe.com/jobs" },
  { name: "Razorpay", industry: "FinTech", location: "Bangalore, India", website: "https://razorpay.com", careerPage: "https://razorpay.com/careers" },
  { name: "Cred", industry: "FinTech", location: "Bangalore, India", website: "https://cred.club", careerPage: "https://careers.cred.club" },
  { name: "Zerodha", industry: "FinTech", location: "Bangalore, India", website: "https://zerodha.com", careerPage: "https://zerodha.com/careers" },
  { name: "PhonePe", industry: "FinTech", location: "Bangalore, India", website: "https://phonepe.com", careerPage: "https://phonepe.com/careers" },

  // ── SaaS ──
  { name: "Atlassian", industry: "SaaS", location: "Bangalore, India", website: "https://atlassian.com", careerPage: "https://atlassian.com/company/careers" },
  { name: "Freshworks", industry: "SaaS", location: "Chennai, India", website: "https://freshworks.com", careerPage: "https://careers.freshworks.com" },
  { name: "Zoho", industry: "SaaS", location: "Chennai, India", website: "https://zoho.com", careerPage: "https://careers.zoho.com" },
  { name: "Postman", industry: "SaaS", location: "Bangalore, India", website: "https://postman.com", careerPage: "https://postman.com/careers" },
  { name: "Notion", industry: "SaaS", location: "Remote", website: "https://notion.so", careerPage: "https://notion.so/careers" },
  { name: "Figma", industry: "SaaS", location: "Remote", website: "https://figma.com", careerPage: "https://figma.com/careers" },
  { name: "Slack", industry: "SaaS", location: "Pune, India", website: "https://slack.com", careerPage: "https://slack.com/careers" },

  // ── AI / ML ──
  { name: "OpenAI", industry: "AI", location: "Remote", website: "https://openai.com", careerPage: "https://openai.com/careers" },
  { name: "DeepMind", industry: "AI", location: "Bangalore, India", website: "https://deepmind.com", careerPage: "https://deepmind.google/careers" },
  { name: "Anthropic", industry: "AI", location: "Remote", website: "https://anthropic.com", careerPage: "https://anthropic.com/careers" },
  { name: "Cohere", industry: "AI", location: "Remote", website: "https://cohere.com", careerPage: "https://cohere.com/careers" },

  // ── Cloud / Infra ──
  { name: "Cloudflare", industry: "Cloud", location: "Remote", website: "https://cloudflare.com", careerPage: "https://cloudflare.com/careers" },
  { name: "DigitalOcean", industry: "Cloud", location: "Remote", website: "https://digitalocean.com", careerPage: "https://digitalocean.com/careers" },
  { name: "Vercel", industry: "Cloud", location: "Remote", website: "https://vercel.com", careerPage: "https://vercel.com/careers" },
  { name: "HashiCorp", industry: "Cloud", location: "Remote", website: "https://hashicorp.com", careerPage: "https://hashicorp.com/careers" },

  // ── Cybersecurity ──
  { name: "CrowdStrike", industry: "Cybersecurity", location: "Pune, India", website: "https://crowdstrike.com", careerPage: "https://crowdstrike.com/careers" },
  { name: "Palo Alto Networks", industry: "Cybersecurity", location: "Bangalore, India", website: "https://paloaltonetworks.com", careerPage: "https://jobs.paloaltonetworks.com" },

  // ── EdTech ──
  { name: "Coursera", industry: "EdTech", location: "Remote", website: "https://coursera.org", careerPage: "https://about.coursera.org/careers" },
  { name: "Unacademy", industry: "EdTech", location: "Bangalore, India", website: "https://unacademy.com", careerPage: "https://unacademy.com/careers" },
  { name: "Byju's", industry: "EdTech", location: "Bangalore, India", website: "https://byjus.com", careerPage: "https://byjus.com/careers" },

  // ── Healthcare ──
  { name: "Practo", industry: "Healthcare", location: "Bangalore, India", website: "https://practo.com", careerPage: "https://practo.com/company/careers" },
  { name: "PharmEasy", industry: "Healthcare", location: "Mumbai, India", website: "https://pharmeasy.in", careerPage: "https://pharmeasy.in/careers" },

  // ── E-commerce ──
  { name: "Flipkart", industry: "E-commerce", location: "Bangalore, India", website: "https://flipkart.com", careerPage: "https://flipkartcareers.com" },
  { name: "Meesho", industry: "E-commerce", location: "Bangalore, India", website: "https://meesho.com", careerPage: "https://meesho.io/careers" },
  { name: "Swiggy", industry: "E-commerce", location: "Bangalore, India", website: "https://swiggy.com", careerPage: "https://careers.swiggy.com" },
  { name: "Zomato", industry: "E-commerce", location: "Gurugram, India", website: "https://zomato.com", careerPage: "https://zomato.com/careers" },

  // ── Startups (early-stage) ──
  { name: "Acme Labs", industry: "SaaS", location: "Remote", website: "https://acmelabs.dev" },
  { name: "NovaByte", industry: "AI", location: "Bangalore, India", website: "https://novabyte.io" },
  { name: "CloudNest", industry: "Cloud", location: "Hyderabad, India", website: "https://cloudnest.dev" },
  { name: "PixelForge", industry: "SaaS", location: "Pune, India", website: "https://pixelforge.co" },
  { name: "DataPulse", industry: "AI", location: "Mumbai, India", website: "https://datapulse.in" },
  { name: "SecureStack", industry: "Cybersecurity", location: "Remote", website: "https://securestack.io" },
  { name: "InfraWorks", industry: "Cloud", location: "Chennai, India", website: "https://infraworks.co" },
  { name: "PayBridge", industry: "FinTech", location: "Mumbai, India", website: "https://paybridge.in" },
  { name: "MedSync", industry: "Healthcare", location: "Delhi, India", website: "https://medsync.health" },
  { name: "LearnPath", industry: "EdTech", location: "Remote", website: "https://learnpath.io" },

  // ── Special character names (edge cases) ──
  { name: "Yahoo!", industry: "Technology", location: "Bangalore, India", website: "https://yahoo.com", careerPage: "https://yahoo.com/careers" },
  { name: "AT&T", industry: "Telecommunications", location: "Hyderabad, India", website: "https://att.com", careerPage: "https://att.jobs" },
  { name: "C++ Foundation", industry: "Technology", location: "Remote", website: "https://isocpp.org" },

  // ── Enterprise ──
  { name: "Oracle", industry: "Technology", location: "Hyderabad, India", website: "https://oracle.com", careerPage: "https://oracle.com/careers" },
  { name: "SAP", industry: "SaaS", location: "Bangalore, India", website: "https://sap.com", careerPage: "https://sap.com/careers" },
  { name: "IBM", industry: "Technology", location: "Bangalore, India", website: "https://ibm.com", careerPage: "https://ibm.com/careers" },
  { name: "Adobe", industry: "SaaS", location: "Noida, India", website: "https://adobe.com", careerPage: "https://adobe.com/careers" },
  { name: "Salesforce", industry: "SaaS", location: "Hyderabad, India", website: "https://salesforce.com", careerPage: "https://salesforce.com/careers" },
  { name: "VMware", industry: "Cloud", location: "Bangalore, India", website: "https://vmware.com", careerPage: "https://vmware.com/careers" },
  { name: "Cisco", industry: "Technology", location: "Bangalore, India", website: "https://cisco.com", careerPage: "https://cisco.com/careers" },
  { name: "Qualcomm", industry: "Technology", location: "Hyderabad, India", website: "https://qualcomm.com", careerPage: "https://qualcomm.com/careers" },
  { name: "Samsung R&D", industry: "Technology", location: "Noida, India", website: "https://samsung.com", careerPage: "https://samsung.com/careers" },
  { name: "Goldman Sachs", industry: "FinTech", location: "Bangalore, India", website: "https://goldmansachs.com", careerPage: "https://goldmansachs.com/careers" },
  { name: "JP Morgan", industry: "FinTech", location: "Hyderabad, India", website: "https://jpmorgan.com", careerPage: "https://jpmorgan.com/careers" },
  { name: "Walmart Global Tech", industry: "E-commerce", location: "Bangalore, India", website: "https://walmart.com", careerPage: "https://tech.walmart.com/careers" },
  { name: "Uber", industry: "Technology", location: "Hyderabad, India", website: "https://uber.com", careerPage: "https://uber.com/careers" },
  { name: "Ola", industry: "Technology", location: "Bangalore, India", website: "https://olacabs.com", careerPage: "https://ola.com/careers" },

  // ── More mid-size ──
  { name: "Thoughtworks", industry: "Technology", location: "Pune, India", website: "https://thoughtworks.com", careerPage: "https://thoughtworks.com/careers" },
  { name: "HashedIn", industry: "SaaS", location: "Bangalore, India", website: "https://hashedin.com", careerPage: "https://hashedin.com/careers" },
  { name: "Amdocs", industry: "Technology", location: "Pune, India", website: "https://amdocs.com", careerPage: "https://amdocs.com/careers" },
  { name: "Intuit", industry: "SaaS", location: "Bangalore, India", website: "https://intuit.com", careerPage: "https://intuit.com/careers" },
  { name: "Nutanix", industry: "Cloud", location: "Bangalore, India", website: "https://nutanix.com", careerPage: "https://nutanix.com/careers" },
  { name: "ServiceNow", industry: "SaaS", location: "Hyderabad, India", website: "https://servicenow.com", careerPage: "https://servicenow.com/careers" },
  { name: "Databricks", industry: "AI", location: "Remote", website: "https://databricks.com", careerPage: "https://databricks.com/careers" },
  { name: "Snowflake", industry: "Cloud", location: "Remote", website: "https://snowflake.com", careerPage: "https://snowflake.com/careers" },
  { name: "Twilio", industry: "SaaS", location: "Remote", website: "https://twilio.com", careerPage: "https://twilio.com/careers" },
  { name: "GitHub", industry: "SaaS", location: "Remote", website: "https://github.com", careerPage: "https://github.com/about/careers" },
];

// Role definitions grouped by category for resume matching
const ROLE_DEFS = {
  frontend: [
    "Frontend Developer", "React Developer", "Senior React Developer",
    "UI Engineer", "Frontend Engineer", "React Native Developer",
    "Web Developer", "UI/UX Developer"
  ],
  backend: [
    "Backend Developer", "Node.js Developer", "Java Developer",
    "Backend Engineer", "API Developer", "Server-Side Engineer",
    "Spring Boot Developer", "Python Developer"
  ],
  fullstack: [
    "Full Stack Developer", "Full Stack Engineer", "MERN Stack Developer",
    "Software Engineer", "Product Engineer", "Software Development Engineer",
    "SDE-1", "SDE-2"
  ],
  intern: [
    "SDE Intern", "Frontend Intern", "Backend Intern",
    "Software Engineering Intern", "Full Stack Intern"
  ],
  devops: [
    "DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer",
    "Platform Engineer", "Infrastructure Engineer"
  ],
  data: [
    "Data Engineer", "ML Engineer", "Data Scientist",
    "AI/ML Engineer", "Data Analyst"
  ],
  // Edge case: extremely long role title
  edgeCase: [
    "Senior Staff Principal Backend Software Engineer (L7) - Distributed Systems & Platform Infrastructure"
  ]
};

const ALL_ROLES = Object.values(ROLE_DEFS).flat();

// Tags by category
const TAG_POOL = {
  frontend: ["React", "Next.js", "TypeScript", "Vue.js", "Tailwind CSS", "HTML/CSS", "JavaScript"],
  backend: ["Node.js", "Express", "Java", "Spring Boot", "Python", "Django", "FastAPI", "Go"],
  database: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "DynamoDB"],
  devops: ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Terraform"],
  general: ["REST API", "GraphQL", "Microservices", "System Design", "DSA", "Agile", "Remote"]
};
const ALL_TAGS = Object.values(TAG_POOL).flat();

// Locations for diversity
const LOCATIONS = [
  "Remote", "Hybrid - Bangalore", "Onsite - Bangalore", "Onsite - Hyderabad",
  "Hybrid - Pune", "Onsite - Mumbai", "Onsite - Chennai", "Onsite - Noida",
  "Remote - India", "Hybrid - Gurugram", "Onsite - Delhi"
];

// Recruiter name pool
const RECRUITER_FIRST_NAMES = [
  "Priya", "Rahul", "Ananya", "Karthik", "Sneha", "Amit", "Divya",
  "Rohan", "Meera", "Varun", "Nisha", "Arjun", "Pooja", "Vikram",
  "Sarah", "Michael", "Jennifer", "David", "Emily", "James"
];
const RECRUITER_LAST_NAMES = [
  "Sharma", "Patel", "Kumar", "Singh", "Mehta", "Jain", "Reddy",
  "Iyer", "Gupta", "Nair", "Chen", "Smith", "Johnson", "Williams"
];

// Notes templates for realism
const NOTES_TEMPLATES = [
  "Applied through employee referral. Referral code: REF-{code}.",
  "Found posting on LinkedIn. Job ID #{code}. Looks like a great team.",
  "Recruiter reached out directly via LinkedIn message.",
  "Applied through campus placement portal.",
  "Strong alignment with my skills in {tech}. Excited about this opportunity.",
  "Company culture seems excellent based on Glassdoor reviews.",
  "Heard great things about the engineering team from {name}.",
  "Position requires {tech} experience which I have from previous projects.",
  "Salary range seems competitive. Need to prepare for system design round.",
  "OA was challenging — 2 medium + 1 hard DSA problems. Completed in 85 minutes.",
  "Technical interview covered {tech}, system design, and behavioral questions.",
  "HR round went well. Discussed compensation and joining timeline.",
  "Received offer letter. Need to decide within 7 days.",
  "Declined offer — accepted a better position at another company.",
  "Ghosted after initial application. No response for 3 weeks.",
  "Resume shortlisted. Waiting for interview schedule.",
  "Panel interview with 3 engineers. Discussed scalability patterns.",
  "Live coding round — built a {tech} component from scratch.",
  "Take-home assignment: Build a REST API with authentication in 48 hours.",
  "Final round with VP of Engineering. Discussed long-term vision.",
  null, null, null // Some jobs have no notes
];

// ─── Journey Simulation ─────────────────────────────────────────────────────

/**
 * Generates a realistic candidate journey (sequence of statuses with dates).
 * Returns { finalStatus, history, interviewDate, followUpDate }
 */
function generateJourney(appliedDate, now) {
  // Define journey templates with realistic progression probabilities
  const journeyTemplates = [
    // Active pipeline (still in progress)
    { path: ["Applied"],                                weight: 8 },
    { path: ["Applied", "OA"],                          weight: 6 },
    { path: ["Applied", "Screening"],                   weight: 4 },
    { path: ["Applied", "OA", "Technical"],             weight: 4 },
    { path: ["Applied", "Screening", "Technical"],      weight: 3 },
    { path: ["Applied", "Screening", "Technical", "HR"], weight: 2 },

    // Completed journeys
    { path: ["Applied", "Rejected"],                                       weight: 15 },
    { path: ["Applied", "OA", "Rejected"],                                 weight: 10 },
    { path: ["Applied", "Screening", "Rejected"],                          weight: 6 },
    { path: ["Applied", "OA", "Technical", "Rejected"],                    weight: 5 },
    { path: ["Applied", "Screening", "Technical", "Rejected"],             weight: 4 },
    { path: ["Applied", "Screening", "Technical", "HR", "Rejected"],       weight: 3 },
    { path: ["Applied", "OA", "Technical", "HR", "Offer"],                 weight: 3 },
    { path: ["Applied", "Screening", "Technical", "HR", "Offer"],          weight: 3 },
    { path: ["Applied", "Screening", "Technical", "Offer"],                weight: 2 },

    // Wishlist items (not yet applied)
    { path: ["Wishlist"],                                                  weight: 5 },
  ];

  // Weighted random selection
  const totalWeight = journeyTemplates.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = journeyTemplates[0];
  for (const template of journeyTemplates) {
    roll -= template.weight;
    if (roll <= 0) { selected = template; break; }
  }

  const path = selected.path;
  const history = [];
  let currentDate = new Date(appliedDate);
  let interviewDate = null;
  let followUpDate = null;

  for (let i = 0; i < path.length; i++) {
    if (i === 0) {
      history.push({ status: path[i], at: new Date(currentDate) });
    } else {
      // Add a realistic gap between stages (3–21 days)
      const gap = randInt(3, 21);
      currentDate = addDays(currentDate, gap);
      // Don't push dates into the future for past journeys
      if (currentDate > now) currentDate = new Date(now);
      history.push({ status: path[i], at: new Date(currentDate) });
    }

    // Set interview date for Technical/HR/Screening stages
    if (["Technical", "HR", "Screening"].includes(path[i]) && !interviewDate) {
      interviewDate = addDays(currentDate, randInt(0, 3));
    }
  }

  const finalStatus = path[path.length - 1];

  // Set follow-up date for in-progress applications
  if (!["Rejected", "Offer", "Wishlist"].includes(finalStatus)) {
    const daysFromNow = randInt(-5, 14);
    followUpDate = addDays(now, daysFromNow);
  }

  return { finalStatus, history, interviewDate, followUpDate };
}

/**
 * Determines which resume category best matches a role title.
 */
function matchResumeCategory(role) {
  const lower = role.toLowerCase();
  if (lower.includes("intern"))                              return "intern";
  if (lower.includes("frontend") || lower.includes("react") || lower.includes("ui") || lower.includes("web")) return "frontend";
  if (lower.includes("backend") || lower.includes("node") || lower.includes("java") || lower.includes("python") || lower.includes("spring") || lower.includes("api") || lower.includes("server")) return "backend";
  if (lower.includes("devops") || lower.includes("sre") || lower.includes("cloud") || lower.includes("platform") || lower.includes("infra")) return "devops";
  if (lower.includes("data") || lower.includes("ml") || lower.includes("ai") || lower.includes("analyst") || lower.includes("scientist")) return "data";
  return "fullstack";
}

/**
 * Generates tags appropriate for a role.
 */
function generateTagsForRole(role) {
  const category = matchResumeCategory(role);
  const categoryTags = TAG_POOL[category === "intern" ? "frontend" : category] || TAG_POOL.general;
  const general = TAG_POOL.general;
  const dbTags = TAG_POOL.database;

  const tags = pickN(categoryTags, randInt(1, 3));
  if (Math.random() > 0.5) tags.push(pick(dbTags));
  if (Math.random() > 0.6) tags.push(pick(general));
  if (Math.random() > 0.7) tags.push(pick(TAG_POOL.devops));

  return [...new Set(tags)]; // Deduplicate
}

/**
 * Generate a realistic note.
 */
function generateNote(role) {
  const template = pick(NOTES_TEMPLATES);
  if (!template) return undefined;
  const techs = generateTagsForRole(role);
  return template
    .replace("{code}", String(randInt(10000, 99999)))
    .replace("{tech}", pick(techs) || "JavaScript")
    .replace("{name}", `${pick(RECRUITER_FIRST_NAMES)} ${pick(RECRUITER_LAST_NAMES)}`);
}

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-tracker";
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB");

  // ── Step 1: Clear all collections ──────────────────────────────────────
  console.log("\n── Clearing existing data ──");
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Company.deleteMany({}),
    Resume.deleteMany({}),
    ActivityLog.deleteMany({})
  ]);
  console.log("✓ All collections cleared");

  // ── Step 2: Create users ───────────────────────────────────────────────
  console.log("\n── Creating users ──");
  const mainUser = await User.create({
    name: "Arjun Mehta",
    email: "test@example.com",
    password: "password123"
  });
  console.log(`✓ Main user: test@example.com / password123 (id: ${mainUser._id})`);

  const emptyUser = await User.create({
    name: "Empty User",
    email: "empty@example.com",
    password: "password123"
  });
  console.log(`✓ Empty user: empty@example.com / password123 (id: ${emptyUser._id})`);

  const userId = mainUser._id;

  // ── Step 3: Create companies ───────────────────────────────────────────
  console.log("\n── Creating companies ──");
  const companyMap = new Map(); // name -> companyDoc
  const companyNotes = [
    "Dream company. Great engineering culture.",
    "Good WLB. Tier-1 product company.",
    "Fast-growing startup. Interesting problem space.",
    "Strong compensation. Competitive hiring bar.",
    "Excellent mentorship program for new grads.",
    "Known for cutting-edge tech stack.",
    null, null // Some without notes
  ];

  for (const def of COMPANY_DEFS) {
    const doc = await Company.create({
      userId,
      name: def.name,
      website: def.website || undefined,
      location: def.location || undefined,
      industry: def.industry || undefined,
      careerPage: def.careerPage || undefined,
      notes: pick(companyNotes) || undefined
    });
    companyMap.set(def.name, doc);
  }
  console.log(`✓ Created ${companyMap.size} companies`);

  // ── Step 4: Create resumes ─────────────────────────────────────────────
  console.log("\n── Creating resumes ──");
  const resumeDefs = [
    { name: "Frontend Resume v2", type: "application/pdf", category: "frontend", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_frontend_v2.pdf" },
    { name: "Frontend Resume v1", type: "application/pdf", category: "frontend", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_frontend_v1.pdf" },
    { name: "Backend Resume", type: "application/pdf", category: "backend", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_backend.pdf" },
    { name: "Full Stack Resume", type: "application/pdf", category: "fullstack", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_fullstack.pdf" },
    { name: "Internship Resume", type: "application/pdf", category: "intern", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_internship.pdf" },
    { name: "DevOps Resume", type: "application/pdf", category: "devops", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_devops.pdf" },
    { name: "Data Engineering Resume", type: "application/pdf", category: "data", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_data_eng.pdf" },
    { name: "General SDE Resume v3", type: "application/pdf", category: "fullstack", url: "https://res.cloudinary.com/demo/raw/upload/v1/resumes/arjun_sde_v3.pdf" },
  ];

  const resumeMap = new Map(); // category -> [resumeDoc]
  const allResumeDocs = [];

  // Stagger createdAt over the last 10 months for realism
  const tenMonthsAgo = addDays(new Date(), -300);
  for (let i = 0; i < resumeDefs.length; i++) {
    const def = resumeDefs[i];
    const doc = await Resume.create({
      userId,
      name: def.name,
      url: def.url,
      type: def.type,
    });
    // Manually backdate for realistic timeline (overwrite timestamps)
    const backdatedAt = addDays(tenMonthsAgo, i * 35);
    await Resume.updateOne({ _id: doc._id }, { $set: { createdAt: backdatedAt, updatedAt: backdatedAt } });

    if (!resumeMap.has(def.category)) resumeMap.set(def.category, []);
    resumeMap.get(def.category).push(doc);
    allResumeDocs.push(doc);
  }
  console.log(`✓ Created ${allResumeDocs.length} resumes`);

  // ── Step 5: Generate jobs ──────────────────────────────────────────────
  console.log("\n── Generating jobs ──");
  const now = new Date();
  const startDate = addDays(now, -300); // ~10 months ago
  const allJobs = [];
  const activityBatch = [];

  // Track reapplication scenarios
  const reappliedCompanies = new Set();

  // Helper: create a single job with full lifecycle
  const createJobRecord = async (companyDef, role, appliedDate, overrides = {}) => {
    const { finalStatus, history, interviewDate, followUpDate } = generateJourney(appliedDate, now);
    const category = matchResumeCategory(role);

    // Pick appropriate resume
    const categoryResumes = resumeMap.get(category) || resumeMap.get("fullstack");
    const resume = pick(categoryResumes);

    // Pick recruiter (70% chance of having one)
    let recruiterName, recruiterEmail;
    if (Math.random() > 0.3) {
      const first = pick(RECRUITER_FIRST_NAMES);
      const last = pick(RECRUITER_LAST_NAMES);
      recruiterName = `${first} ${last}`;
      recruiterEmail = `${first.toLowerCase()}.${last.toLowerCase()}@${companyDef.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    }

    // Salary (only ~50% of jobs have salary info)
    let salary;
    if (Math.random() > 0.5) {
      if (role.toLowerCase().includes("intern")) {
        salary = randInt(15000, 80000);
      } else if (role.includes("Senior") || role.includes("Staff") || role.includes("SDE-2")) {
        salary = randInt(2500000, 6000000);
      } else {
        salary = randInt(800000, 2500000);
      }
    }

    const companyDoc = companyMap.get(companyDef.name);

    // Compute tags
    const tags = generateTagsForRole(role);

    // Location (prefer company location but sometimes override)
    const location = Math.random() > 0.3 ? (companyDef.location || pick(LOCATIONS)) : pick(LOCATIONS);

    // Job URL (~60% have one)
    let jobUrl;
    if (Math.random() > 0.4 && companyDef.careerPage) {
      jobUrl = `${companyDef.careerPage}/${randInt(10000, 99999)}`;
    }

    const jobData = {
      userId,
      company: companyDef.name,
      companyId: companyDoc?._id,
      role,
      status: overrides.status || finalStatus,
      appliedDate: overrides.appliedDate || appliedDate,
      source: overrides.source || pick(SOURCES),
      priority: overrides.priority || pick(PRIORITIES),
      location,
      salary,
      recruiterName,
      recruiterEmail,
      jobUrl,
      followUpDate: overrides.followUpDate || followUpDate,
      interviewDate: overrides.interviewDate || interviewDate,
      tags,
      resumeUrl: resume?.url,
      resumeId: resume?._id,
      notes: generateNote(role),
      history: overrides.history || history,
    };

    const job = await Job.create(jobData);

    // Backdate createdAt to match appliedDate
    await Job.updateOne({ _id: job._id }, { $set: { createdAt: appliedDate, updatedAt: addDays(appliedDate, randInt(0, 30)) } });

    allJobs.push(job);

    // Generate activity logs for this job
    const logs = [];
    logs.push({ userId, jobId: job._id, action: "Job created", details: `Added ${role} at ${companyDef.name}`, createdAt: appliedDate });

    if (resume) {
      logs.push({ userId, jobId: job._id, action: "Resume attached", details: `Attached "${resume.name}"`, createdAt: addHours(appliedDate, randInt(1, 4)) });
    }

    if (jobData.status !== "Wishlist") {
      logs.push({ userId, jobId: job._id, action: "Application submitted", details: `Submitted via ${jobData.source}`, createdAt: addHours(appliedDate, randInt(2, 8)) });
    }

    // Log each status transition
    for (let i = 1; i < (overrides.history || history).length; i++) {
      const h = (overrides.history || history)[i];
      logs.push({
        userId,
        jobId: job._id,
        action: "Status changed",
        details: `Status changed to "${h.status}"`,
        createdAt: h.at
      });
    }

    if (followUpDate) {
      logs.push({ userId, jobId: job._id, action: "Follow-up scheduled", details: `Follow-up set for ${followUpDate.toLocaleDateString()}`, createdAt: addDays(appliedDate, randInt(1, 5)) });
    }

    if (interviewDate) {
      logs.push({ userId, jobId: job._id, action: "Interview scheduled", details: `Interview at ${companyDef.name} on ${interviewDate.toLocaleDateString()}`, createdAt: addDays(appliedDate, randInt(3, 10)) });
    }

    if (jobData.notes) {
      logs.push({ userId, jobId: job._id, action: "Notes added", details: jobData.notes.substring(0, 80), createdAt: addHours(appliedDate, randInt(1, 48)) });
    }

    activityBatch.push(...logs);

    return job;
  };

  // ── 5a: Distribute jobs across 10 months with realistic volume curve ──
  // Simulate an increasing application rate (candidate ramps up over time)
  const monthDistribution = [
    // Month 0-9 ago: job counts per month (increasing trend with a dip)
    15, 20, 25, 30, 35, 45, 50, 40, 55, 60
  ];

  let jobCount = 0;
  for (let monthIdx = 0; monthIdx < monthDistribution.length; monthIdx++) {
    const count = monthDistribution[monthIdx];
    const monthStart = addDays(startDate, monthIdx * 30);

    for (let j = 0; j < count; j++) {
      const dayOffset = randInt(0, 28); // Spread within the month
      const appliedDate = addDays(monthStart, dayOffset);

      // Don't create future-dated applications
      if (appliedDate > now) continue;

      const companyDef = pick(COMPANY_DEFS);
      const roleCategory = pick(Object.keys(ROLE_DEFS));
      const role = pick(ROLE_DEFS[roleCategory]);

      await createJobRecord(companyDef, role, appliedDate);
      jobCount++;

      if (jobCount % 50 === 0) {
        process.stdout.write(`  ... ${jobCount} jobs created\r`);
      }
    }
  }

  // ── 5b: Reapplication scenarios ────────────────────────────────────────
  console.log(`\n  Adding reapplication scenarios...`);

  // Google: Applied 8 months ago → Rejected → Reapplied 2 months ago for different role
  const googleReapply1 = addDays(now, -240);
  await createJobRecord(
    COMPANY_DEFS.find(c => c.name === "Google"),
    "Frontend Developer",
    googleReapply1,
    {
      status: "Rejected",
      history: [
        { status: "Applied", at: googleReapply1 },
        { status: "OA", at: addDays(googleReapply1, 14) },
        { status: "Rejected", at: addDays(googleReapply1, 28) }
      ]
    }
  );
  await createJobRecord(
    COMPANY_DEFS.find(c => c.name === "Google"),
    "Full Stack Engineer",
    addDays(now, -60),
    {
      status: "Technical",
      history: [
        { status: "Applied", at: addDays(now, -60) },
        { status: "OA", at: addDays(now, -45) },
        { status: "Technical", at: addDays(now, -30) }
      ],
      interviewDate: addDays(now, 5),
      followUpDate: addDays(now, 3),
    }
  );
  jobCount += 2;

  // Amazon: Applied → Rejected → Reapplied with different resume
  const amzReapply1 = addDays(now, -200);
  await createJobRecord(
    COMPANY_DEFS.find(c => c.name === "Amazon"),
    "SDE-1",
    amzReapply1,
    {
      status: "Rejected",
      history: [
        { status: "Applied", at: amzReapply1 },
        { status: "OA", at: addDays(amzReapply1, 7) },
        { status: "Technical", at: addDays(amzReapply1, 21) },
        { status: "Rejected", at: addDays(amzReapply1, 35) }
      ]
    }
  );
  await createJobRecord(
    COMPANY_DEFS.find(c => c.name === "Amazon"),
    "SDE-2",
    addDays(now, -30),
    {
      status: "HR",
      history: [
        { status: "Applied", at: addDays(now, -30) },
        { status: "OA", at: addDays(now, -20) },
        { status: "Technical", at: addDays(now, -12) },
        { status: "HR", at: addDays(now, -5) }
      ],
      interviewDate: addDays(now, 2),
      followUpDate: addDays(now, 7),
      priority: "High"
    }
  );
  jobCount += 2;

  // ── 5c: Upcoming calendar events (interviews & follow-ups this week/month) ──
  console.log("  Adding upcoming calendar events...");

  const upcomingCompanies = ["Stripe", "Microsoft", "Flipkart", "Razorpay", "Atlassian", "Postman", "Intuit", "Freshworks"];
  for (let i = 0; i < upcomingCompanies.length; i++) {
    const companyDef = COMPANY_DEFS.find(c => c.name === upcomingCompanies[i]);
    if (!companyDef) continue;
    const role = pick(ROLE_DEFS.fullstack.concat(ROLE_DEFS.frontend));
    const appliedDate = addDays(now, -randInt(14, 45));
    const intDate = addDays(now, i + 1); // Stagger across next 8 days

    await createJobRecord(companyDef, role, appliedDate, {
      status: i < 4 ? "Technical" : "HR",
      interviewDate: intDate,
      followUpDate: addDays(now, i + 3),
      priority: i < 3 ? "High" : "Medium",
      history: [
        { status: "Applied", at: appliedDate },
        { status: "Screening", at: addDays(appliedDate, 7) },
        { status: i < 4 ? "Technical" : "HR", at: addDays(appliedDate, 14) }
      ]
    });
    jobCount++;
  }

  // ── 5d: Overdue follow-ups (past dates) ────────────────────────────────
  console.log("  Adding overdue follow-ups...");
  for (let i = 0; i < 5; i++) {
    const companyDef = pick(COMPANY_DEFS);
    const role = pick(ALL_ROLES);
    const appliedDate = addDays(now, -randInt(30, 60));
    await createJobRecord(companyDef, role, appliedDate, {
      followUpDate: addDays(now, -randInt(1, 10)), // Overdue
      status: "Applied",
      history: [{ status: "Applied", at: appliedDate }]
    });
    jobCount++;
  }

  // ── 5e: Edge cases ─────────────────────────────────────────────────────
  console.log("  Adding edge case jobs...");

  // Extremely long role title
  await createJobRecord(
    pick(COMPANY_DEFS),
    ROLE_DEFS.edgeCase[0],
    addDays(now, -15),
    { priority: "High", status: "Applied" }
  );
  jobCount++;

  // Job created today
  await createJobRecord(pick(COMPANY_DEFS), "Software Engineer", now, {
    status: "Wishlist",
    history: [{ status: "Wishlist", at: now }]
  });
  jobCount++;

  // Job with no optional data (no salary, recruiter, location, tags, notes)
  const bareCompanyDef = pick(COMPANY_DEFS);
  const bareJob = await Job.create({
    userId,
    company: bareCompanyDef.name,
    role: "SE",
    status: "Applied",
    appliedDate: addDays(now, -7),
    source: "Other",
    priority: "Low",
    history: [{ status: "Applied", at: addDays(now, -7) }]
  });
  allJobs.push(bareJob);
  activityBatch.push({ userId, jobId: bareJob._id, action: "Job created", details: `Bare job — no optional data`, createdAt: addDays(now, -7) });
  jobCount++;

  // Job with extremely high salary
  await createJobRecord(
    COMPANY_DEFS.find(c => c.name === "Netflix"),
    "Senior Staff Engineer",
    addDays(now, -90),
    { status: "Offer", priority: "High" }
  );
  jobCount++;

  // Same-day rejection
  const sdRejDate = addDays(now, -20);
  await createJobRecord(
    pick(COMPANY_DEFS),
    "Backend Developer",
    sdRejDate,
    {
      status: "Rejected",
      history: [
        { status: "Applied", at: sdRejDate },
        { status: "Rejected", at: addHours(sdRejDate, 4) }
      ]
    }
  );
  jobCount++;

  console.log(`✓ Created ${jobCount} total jobs`);

  // ── Step 6: Bulk insert activity logs ──────────────────────────────────
  console.log("\n── Inserting activity logs ──");
  // Backdate all activity logs
  const formattedLogs = activityBatch.map(log => ({
    ...log,
    updatedAt: log.createdAt
  }));

  if (formattedLogs.length > 0) {
    await ActivityLog.insertMany(formattedLogs, { ordered: false });
  }
  console.log(`✓ Inserted ${formattedLogs.length} activity log entries`);

  // ── Step 7: Generate CSV test files ────────────────────────────────────
  console.log("\n── Generating CSV test files ──");

  const validCsv = `company,role,status,appliedDate,source,priority,location,salary,recruiterName,recruiterEmail,jobUrl,followUpDate,interviewDate,tags,notes
Google,SDE Intern,Applied,2026-06-01,LinkedIn,High,Bangalore,50000,Sarah Chen,sarah@google.com,https://careers.google.com/12345,2026-06-10,2026-06-15,"React;Node","Applied through referral"
Amazon,SDE-1,OA,2026-06-03,Referral,Medium,Hyderabad,1800000,John Smith,john@amazon.com,https://amazon.jobs/67890,2026-06-12,2026-06-18,"Java;AWS","OA cleared - 3 questions"
Microsoft,Frontend Developer,Screening,2026-05-20,Career Page,High,Noida,2200000,Priya Sharma,priya@microsoft.com,https://careers.microsoft.com/11111,,2026-06-20,"React;TypeScript","Phone screen scheduled"
Stripe,Backend Engineer,Applied,2026-06-05,LinkedIn,Medium,Remote,,,,,,Node.js;MongoDB,
Meta,Full Stack Developer,Technical,2026-05-15,Referral,High,Gurugram,2500000,Amit Kumar,amit@meta.com,https://metacareers.com/22222,2026-06-08,2026-06-12,"React;Node.js;GraphQL","Strong referral from team lead"`;

  const invalidCsv = `company,role,status,appliedDate,source,priority,location,salary
,Backend Dev,Applied,2026-06-01,LinkedIn,High,Remote,100000
Google,,Applied,2026-06-01,LinkedIn,Medium,Bangalore,50000
Amazon,SDE,InvalidStatus,2026-06-01,Referral,High,Hyderabad,70000
Microsoft,Frontend Dev,Applied,not-a-date,Career Page,Medium,Noida,60000
Flipkart,SDE Intern,Applied,2026-06-01,LinkedIn,High,Bangalore,25000
Flipkart,SDE Intern,Applied,2026-06-01,LinkedIn,High,Bangalore,25000
X,Y,Applied,2026-06-01,Other,Low,Remote,0`;

  const fs = await import("fs");
  const path = await import("path");
  const testDir = path.join(process.cwd(), "test-data");
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, "valid_import.csv"), validCsv, "utf-8");
  fs.writeFileSync(path.join(testDir, "invalid_import.csv"), invalidCsv, "utf-8");
  console.log("✓ Generated test CSV files in backend/test-data/");

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  SEED COMPLETE — Summary");
  console.log("═".repeat(60));
  console.log(`  Users:          2 (main + empty)`);
  console.log(`  Companies:      ${companyMap.size}`);
  console.log(`  Resumes:        ${allResumeDocs.length}`);
  console.log(`  Jobs:           ${jobCount}`);
  console.log(`  Activity Logs:  ${formattedLogs.length}`);
  console.log(`  CSV Test Files: 2 (valid + invalid)`);
  console.log("─".repeat(60));
  console.log(`  Login:  test@example.com / password123`);
  console.log(`  Empty:  empty@example.com / password123`);
  console.log("═".repeat(60));

  await mongoose.disconnect();
  console.log("\n✓ Disconnected from MongoDB");
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n✗ Seed failed:", err);
  process.exit(1);
});
