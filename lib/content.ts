export type ProjectBlock =
  | { type: "image"; src: string; alt?: string }
  | { type: "double"; left: { src: string; alt?: string }; right: { src: string; alt?: string } }
  | { type: "quote"; text: string; attribution?: string };

export type Project = {
  slug: string;
  title: string;
  intro: string;
  roles: string[];
  heroSrc: string;
  blocks: ProjectBlock[];
  links?: { label: string; url: string }[];
};

export type Photo = {
  id: string;
  src: string;
  alt: string;
  location: string;
  album: string;
  takenDate?: string;
  world: { x: number; y: number; w: number; h: number };
  featured?: boolean;
};

export type LinkedInPost = {
  id: string;
  title: string;
  date: string;
  url: string;
  excerpt: string;
  coverSrc: string;
  featured?: boolean;
};

export type FeedItem =
  | ({ type: "linkedin" } & LinkedInPost)
  | ({ type: "photo" } & Photo);

export const SITE = {
  email: "isaacseiler@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/isaacseiler/",
  githubUrl: "https://github.com/isaaciseiler-beep",
  resumePdfPath: "/assets/resume/isaac-seiler-resume.pdf",
  contactFormEmbedUrl: "",
  aboutMarkdown: `I'm Isaac, a recent WashU graduate, Fulbright and Truman Scholar, and a member of OpenAI's ChatGPT Lab.

I've managed the communications program for a Member of Congress, published work with OpenAI, built a congressional office, founded my own consultancy, and conducted international research on the social and material impacts of AI and the Internet.

I'm currently in the market for tech roles starting Summer 2026.`
};

export const LINKEDIN_POSTS: LinkedInPost[] = [
  {
    id: "linkedin-01",
    title: "Authored Substack Post on Education for OpenAI",
    date: "2025-08-05",
    url: "https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan",
    excerpt:
      "A practical reflection on higher education, AI literacy, and what students actually ask when AI becomes part of daily learning.",
    coverSrc: "/assets/feed/linkedin/post-01.jpg",
    featured: true
  },
  {
    id: "linkedin-02",
    title: "Testimonial Featured in ChatGPT Pulse Launch",
    date: "2025-09-17",
    url: "https://openai.com/index/introducing-chatgpt-pulse/",
    excerpt:
      "Included in the launch story for ChatGPT Pulse, sharing perspective on experimentation and user-led research in education.",
    coverSrc: "/assets/feed/linkedin/post-02.jpg",
    featured: true
  },
  {
    id: "linkedin-03",
    title: "Study Mode Spotlight on ChatGPT Instagram",
    date: "2025-07-29",
    url: "https://www.instagram.com/chatgpt/reel/DNyG5VvXEZM/",
    excerpt:
      "Featured in the Study Mode spotlight, focused on workflows for inquiry, revision, and applied classroom use.",
    coverSrc: "/assets/feed/linkedin/post-03.jpg",
    featured: true
  },
  {
    id: "linkedin-04",
    title: "Won 2024 Truman Scholarship",
    date: "2024-04-13",
    url: "https://source.washu.edu/2024/04/junior-seiler-awarded-truman-scholarship/",
    excerpt:
      "Recognition for policy work, civic leadership, and long-term public service impact at Washington University in St. Louis.",
    coverSrc: "/assets/feed/linkedin/post-04.jpg",
    featured: true
  },
  {
    id: "linkedin-05",
    title: "Co-Authored 100 Chats Project with the ChatGPT Lab",
    date: "2025-06-19",
    url: "https://chatgpt.com/100chats-project",
    excerpt:
      "A co-authored project documenting how real people use conversational AI for work, learning, and difficult decisions.",
    coverSrc: "/assets/feed/linkedin/post-05.jpg",
    featured: true
  },
  {
    id: "linkedin-06",
    title: "Named 2024 Rhodes Scholarship Finalist",
    date: "2024-11-10",
    url: "https://source.washu.edu/2024/11/seniors-darden-seiler-were-rhodes-scholars-finalists/",
    excerpt:
      "Recognized as a Rhodes finalist while continuing policy, communication, and research work across institutions.",
    coverSrc: "/assets/feed/linkedin/post-06.jpg",
    featured: true
  },
  {
    id: "linkedin-07",
    title: "Won Fulbright Award to Taiwan",
    date: "2025-06-01",
    url: "https://source.wustl.edu/2025/06/several-alumni-earn-fulbright-awards/",
    excerpt:
      "Awarded Fulbright support for field research in Taiwan around internet infrastructure and AI social adoption.",
    coverSrc: "/assets/feed/linkedin/post-07.jpg",
    featured: true
  },
  {
    id: "linkedin-08",
    title: "Truman Scholarship Interview",
    date: "2024-04-24",
    url: "https://www.studlife.com/news/2024/04/24/isaac-seiler-named-truman-scholar",
    excerpt:
      "A campus interview focused on motivations, process, and the policy commitments behind the Truman application.",
    coverSrc: "/assets/feed/linkedin/post-08.jpg"
  },
  {
    id: "linkedin-09",
    title: "60 Truman Scholars Announced (2024)",
    date: "2024-04-13",
    url: "https://www.forbes.com/sites/michaeltnietzel/2024/04/13/the-truman-scholars-for-2024-are-announced/",
    excerpt:
      "National announcement of the 2024 Truman Scholars cohort across U.S. universities and public-interest disciplines.",
    coverSrc: "/assets/feed/linkedin/post-09.jpg"
  },
  {
    id: "linkedin-10",
    title: "Won Award for Best College Newspaper Photography",
    date: "2025-05-22",
    url: "https://source.washu.edu/2025/05/student-life-wins-best-newspaper-honor-at-missouri-college-media-awards/",
    excerpt:
      "Statewide journalism recognition tied to student reporting, visuals, and newsroom collaboration.",
    coverSrc: "/assets/feed/linkedin/post-10.jpg"
  },
  {
    id: "linkedin-11",
    title: "University Profile",
    date: "2025-03-15",
    url: "https://artsci.washu.edu/ampersand/isaac-seiler-setting-his-sights-high",
    excerpt:
      "Profile feature on cross-sector work spanning journalism, policy, civic communication, and emerging technology.",
    coverSrc: "/assets/feed/linkedin/post-11.jpg"
  }
];

export const PHOTOS: Photo[] = [
  {
    id: "photo-01",
    src: "/assets/photos/photo-01.jpg",
    alt: "Christchurch, New Zealand",
    location: "Christchurch, New Zealand",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-12",
    world: { x: -1280, y: -760, w: 420, h: 300 },
    featured: true
  },
  {
    id: "photo-02",
    src: "/assets/photos/photo-02.jpg",
    alt: "Banli, Taiwan",
    location: "Banli, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-02-09",
    world: { x: -630, y: -770, w: 410, h: 300 },
    featured: true
  },
  {
    id: "photo-03",
    src: "/assets/photos/photo-03.jpg",
    alt: "Aoraki National Park",
    location: "Aoraki National Park",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-19",
    world: { x: -20, y: -790, w: 430, h: 310 },
    featured: true
  },
  {
    id: "photo-04",
    src: "/assets/photos/photo-04.jpg",
    alt: "Las Palmas de Gran Canaria, Spain",
    location: "Las Palmas de Gran Canaria, Spain",
    album: "SPAIN 2024",
    takenDate: "2024-06-02",
    world: { x: 620, y: -780, w: 420, h: 300 },
    featured: true
  },
  {
    id: "photo-05",
    src: "/assets/photos/photo-05.jpg",
    alt: "Djúpivogur, Iceland",
    location: "Djúpivogur, Iceland",
    album: "ICELAND 2023",
    takenDate: "2023-09-05",
    world: { x: 1250, y: -790, w: 430, h: 310 },
    featured: true
  },
  {
    id: "photo-06",
    src: "/assets/photos/photo-06.jpg",
    alt: "Las Palmas de Gran Canaria, Spain",
    location: "Las Palmas de Gran Canaria, Spain",
    album: "SPAIN 2024",
    takenDate: "2024-06-04",
    world: { x: -1300, y: -220, w: 400, h: 290 },
    featured: true
  },
  {
    id: "photo-07",
    src: "/assets/photos/photo-07.jpg",
    alt: "Qiaozi Village, Taiwan",
    location: "Qiaozi Village, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-02-12",
    world: { x: -680, y: -240, w: 390, h: 280 },
    featured: true
  },
  {
    id: "photo-08",
    src: "/assets/photos/photo-08.jpg",
    alt: "Bitou Cape, Taiwan",
    location: "Bitou Cape, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-02-17",
    world: { x: -20, y: -250, w: 410, h: 290 },
    featured: true
  },
  {
    id: "photo-09",
    src: "/assets/photos/photo-09.jpg",
    alt: "Vik, Iceland",
    location: "Vik, Iceland",
    album: "ICELAND 2023",
    takenDate: "2023-09-13",
    world: { x: 620, y: -250, w: 430, h: 300 },
    featured: true
  },
  {
    id: "photo-10",
    src: "/assets/photos/photo-10.jpg",
    alt: "Keelung, Taiwan",
    location: "Keelung, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-02-19",
    world: { x: 1260, y: -230, w: 420, h: 300 },
    featured: true
  },
  {
    id: "photo-11",
    src: "/assets/photos/photo-11.jpg",
    alt: "Aoraki National Park",
    location: "Aoraki National Park",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-22",
    world: { x: -1270, y: 320, w: 410, h: 290 }
  },
  {
    id: "photo-12",
    src: "/assets/photos/photo-12.jpg",
    alt: "Beigan, Taiwan",
    location: "Beigan, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-01-29",
    world: { x: -650, y: 330, w: 430, h: 300 }
  },
  {
    id: "photo-13",
    src: "/assets/photos/photo-13.jpg",
    alt: "Lienchiang County, Taiwan",
    location: "Lienchiang County, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-02-03",
    world: { x: -40, y: 330, w: 420, h: 300 }
  },
  {
    id: "photo-14",
    src: "/assets/photos/photo-14.jpg",
    alt: "Cass Bay, New Zealand",
    location: "Cass Bay, New Zealand",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-10",
    world: { x: 610, y: 330, w: 410, h: 290 }
  },
  {
    id: "photo-15",
    src: "/assets/photos/photo-15.jpg",
    alt: "Lienchiang County, Taiwan",
    location: "Lienchiang County, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-02-04",
    world: { x: 1240, y: 330, w: 430, h: 310 }
  },
  {
    id: "photo-16",
    src: "/assets/photos/photo-16.jpg",
    alt: "Whataroa, New Zealand",
    location: "Whataroa, New Zealand",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-17",
    world: { x: -1260, y: 860, w: 420, h: 300 }
  },
  {
    id: "photo-17",
    src: "/assets/photos/photo-17.jpg",
    alt: "Goose Bay, New Zealand",
    location: "Goose Bay, New Zealand",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-14",
    world: { x: -620, y: 860, w: 420, h: 300 }
  },
  {
    id: "photo-18",
    src: "/assets/photos/photo-18.jpg",
    alt: "Beigan, Taiwan",
    location: "Beigan, Taiwan",
    album: "TAIWAN 2025",
    takenDate: "2025-01-30",
    world: { x: 0, y: 860, w: 390, h: 280 }
  },
  {
    id: "photo-19",
    src: "/assets/photos/photo-19.jpg",
    alt: "Reykjavík, Iceland",
    location: "Reykjavík, Iceland",
    album: "ICELAND 2023",
    takenDate: "2023-09-01",
    world: { x: 610, y: 860, w: 410, h: 290 }
  },
  {
    id: "photo-20",
    src: "/assets/photos/photo-20.jpg",
    alt: "Milford Sound, New Zealand",
    location: "Milford Sound, New Zealand",
    album: "NEW ZEALAND 2024",
    takenDate: "2024-03-24",
    world: { x: 1260, y: 860, w: 430, h: 310 }
  },
  {
    id: "photo-21",
    src: "/assets/photos/photo-21.jpg",
    alt: "Reykjavík, Iceland",
    location: "Reykjavík, Iceland",
    album: "ICELAND 2023",
    takenDate: "2023-09-02",
    world: { x: -310, y: 1310, w: 410, h: 290 }
  },
  {
    id: "photo-22",
    src: "/assets/photos/photo-22.jpg",
    alt: "Stokksnes, Iceland",
    location: "Stokksnes, Iceland",
    album: "ICELAND 2023",
    takenDate: "2023-09-18",
    world: { x: 350, y: 1310, w: 420, h: 300 }
  }
];

export const PROJECTS: Project[] = [
  {
    slug: "artificial-intelligence-in-state-government-index",
    title: "Artificial Intelligence in State Government Index",
    intro:
      "A state-by-state research effort mapping AI adoption, procurement, and policy risk in public sector operations.",
    roles: ["Research", "Policy Analysis", "Data Synthesis"],
    heroSrc: "/assets/projects/artificial-intelligence-in-state-government-index/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/artificial-intelligence-in-state-government-index/block-01.jpg",
        alt: "State government AI index cover"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/artificial-intelligence-in-state-government-index/block-02.jpg",
          alt: "Policy taxonomy board"
        },
        right: {
          src: "/assets/projects/artificial-intelligence-in-state-government-index/block-03.jpg",
          alt: "State comparison chart"
        }
      },
      {
        type: "quote",
        text: "The index translates fragmented agency experiments into a comparable governance map.",
        attribution: "Project summary"
      }
    ],
    links: [{ label: "Project Notes", url: "https://chatgpt.com/100chats-project" }]
  },
  {
    slug: "congressional-office-setup-100-day-report",
    title: "Congressional Office Setup and 100 Day Report",
    intro:
      "Built communications and operating infrastructure for a new congressional office, then delivered a 100-day strategic report.",
    roles: ["Communications", "Operations", "Strategic Reporting"],
    heroSrc: "/assets/projects/congressional-office-setup-100-day-report/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/congressional-office-setup-100-day-report/block-01.jpg",
        alt: "Congressional office launch materials"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/congressional-office-setup-100-day-report/block-02.jpg",
          alt: "Workflow map"
        },
        right: {
          src: "/assets/projects/congressional-office-setup-100-day-report/block-03.jpg",
          alt: "Constituent communications drafts"
        }
      },
      {
        type: "quote",
        text: "A fast office buildout only works when policy, messaging, and service operations are treated as one system.",
        attribution: "100-day report"
      }
    ]
  },
  {
    slug: "senior-thesis-local-journalism",
    title: "AI, Digital Platforms, and Journalism Research",
    intro:
      "Senior thesis research on local journalism resilience amid platform dependency, AI acceleration, and economic pressure.",
    roles: ["Academic Research", "Interviewing", "Writing"],
    heroSrc: "/assets/projects/senior-thesis-local-journalism/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/senior-thesis-local-journalism/block-01.jpg",
        alt: "Thesis draft and notes"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/senior-thesis-local-journalism/block-02.jpg",
          alt: "Field interview excerpts"
        },
        right: {
          src: "/assets/projects/senior-thesis-local-journalism/block-03.jpg",
          alt: "Publication framework"
        }
      },
      {
        type: "quote",
        text: "Local journalism now competes on trust, not just speed.",
        attribution: "Thesis finding"
      }
    ]
  },
  {
    slug: "electric-vehicle-access-analysis",
    title: "Electric Vehicle Charging Access Analysis",
    intro:
      "A data-backed review of EV charging gaps and equity constraints across target geographies.",
    roles: ["Quantitative Research", "GIS Review", "Policy Briefing"],
    heroSrc: "/assets/projects/electric-vehicle-access-analysis/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/electric-vehicle-access-analysis/block-01.jpg",
        alt: "EV access map"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/electric-vehicle-access-analysis/block-02.jpg",
          alt: "Coverage heatmap"
        },
        right: {
          src: "/assets/projects/electric-vehicle-access-analysis/block-03.jpg",
          alt: "Charging corridor model"
        }
      },
      {
        type: "quote",
        text: "Infrastructure planning fails when it ignores range anxiety and renter reality.",
        attribution: "Research brief"
      }
    ]
  },
  {
    slug: "communications-consultancy-supporting-local-candidates",
    title: "Communications Consultancy and Supporting Local Candidates",
    intro:
      "Founded and operated a consultancy supporting local candidates with message architecture, rapid response, and voter-facing narrative.",
    roles: ["Founder", "Message Strategy", "Campaign Communications"],
    heroSrc: "/assets/projects/communications-consultancy-supporting-local-candidates/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/communications-consultancy-supporting-local-candidates/block-01.jpg",
        alt: "Campaign message system"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/communications-consultancy-supporting-local-candidates/block-02.jpg",
          alt: "Canvass scripts"
        },
        right: {
          src: "/assets/projects/communications-consultancy-supporting-local-candidates/block-03.jpg",
          alt: "Digital rapid response"
        }
      },
      {
        type: "quote",
        text: "Winning local races requires disciplined message coherence across every touchpoint.",
        attribution: "Consultancy practice"
      }
    ]
  },
  {
    slug: "fulbright-focus-group-sponsored-by-openai",
    title: "Fulbright Focus Group Sponsored by OpenAI",
    intro:
      "Led a Fulbright-linked focus group studying everyday AI usage and institutional trust in educational contexts.",
    roles: ["Facilitation", "Qualitative Research", "Synthesis"],
    heroSrc: "/assets/projects/fulbright-focus-group-sponsored-by-openai/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/fulbright-focus-group-sponsored-by-openai/block-01.jpg",
        alt: "Focus group session"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/fulbright-focus-group-sponsored-by-openai/block-02.jpg",
          alt: "Discussion coding"
        },
        right: {
          src: "/assets/projects/fulbright-focus-group-sponsored-by-openai/block-03.jpg",
          alt: "Insight framework"
        }
      },
      {
        type: "quote",
        text: "Participants were less concerned about AI capability than governance clarity.",
        attribution: "Focus group synthesis"
      }
    ],
    links: [{ label: "100 Chats Project", url: "https://chatgpt.com/100chats-project" }]
  },
  {
    slug: "political-reporting-at-washu",
    title: "Political Reporting at WashU",
    intro:
      "Produced campus political reporting covering elections, protest, institutional response, and governance narratives.",
    roles: ["Reporting", "Interviewing", "News Writing"],
    heroSrc: "/assets/projects/political-reporting-at-washu/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/political-reporting-at-washu/block-01.jpg",
        alt: "Student Life newsroom work"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/political-reporting-at-washu/block-02.jpg",
          alt: "Campus interview"
        },
        right: {
          src: "/assets/projects/political-reporting-at-washu/block-03.jpg",
          alt: "Election coverage board"
        }
      },
      {
        type: "quote",
        text: "Student reporting can hold institutions accountable while staying human-scale and local.",
        attribution: "Editorial note"
      }
    ],
    links: [
      {
        label: "Student Life Coverage",
        url: "https://www.studlife.com/news/2024/11/14/after-racist-texts-following-election-discuss-combating-hate"
      }
    ]
  },
  {
    slug: "boehringer-cares-foundation-rebrand-strategy-shift",
    title: "Boehringer Cares Foundation Rebrand and Strategy Shift",
    intro:
      "Helped lead a full rebrand and strategic repositioning effort across internal communications, UX, and program narrative.",
    roles: ["Brand Strategy", "Research", "UX Collaboration"],
    heroSrc: "/assets/projects/boehringer-cares-foundation-rebrand-strategy-shift/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/boehringer-cares-foundation-rebrand-strategy-shift/block-01.jpg",
        alt: "Boehringer Cares rebrand hero"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/boehringer-cares-foundation-rebrand-strategy-shift/block-02.jpg",
          alt: "Volunteer UX improvements"
        },
        right: {
          src: "/assets/projects/boehringer-cares-foundation-rebrand-strategy-shift/block-03.jpg",
          alt: "Internal engagement assets"
        }
      },
      {
        type: "quote",
        text: "The strategy shift aligned mission clarity with measurable participation growth.",
        attribution: "BICF summary"
      }
    ],
    links: [
      {
        label: "Revamped Boehringer Cares Website",
        url: "https://www.boehringer-ingelheim.com/us/boehringer-ingelheim-cares-foundation"
      }
    ]
  },
  {
    slug: "2022-institute-for-nonprofit-news-index-survey",
    title: "The 2022 Institute for Nonprofit News Index Survey",
    intro:
      "Contributed research and stakeholder outreach for the INN Index, combining survey synthesis with structured data cleaning.",
    roles: ["Research Assistant", "Data Management", "Stakeholder Outreach"],
    heroSrc: "/assets/projects/2022-institute-for-nonprofit-news-index-survey/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/2022-institute-for-nonprofit-news-index-survey/block-01.jpg",
        alt: "INN survey dashboard"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/2022-institute-for-nonprofit-news-index-survey/block-02.jpg",
          alt: "Response coding"
        },
        right: {
          src: "/assets/projects/2022-institute-for-nonprofit-news-index-survey/block-03.jpg",
          alt: "Dataset review"
        }
      },
      {
        type: "quote",
        text: "Method rigor and participant trust mattered as much as the final metrics.",
        attribution: "INN Index notes"
      }
    ],
    links: [
      {
        label: "2022 INN Index Report",
        url: "https://inn.org/research/inn-index/inn-index-2022/about-the-index/"
      }
    ]
  },
  {
    slug: "exclusive-interview-with-high-visibility-congressperson",
    title: "Exclusive Interview with High-Visibility Congressperson",
    intro:
      "Reported direct interviews during a volatile post-impeachment period, covering accountability and party fracture dynamics.",
    roles: ["Political Reporting", "Interviewing", "Analysis"],
    heroSrc: "/assets/projects/exclusive-interview-with-high-visibility-congressperson/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/exclusive-interview-with-high-visibility-congressperson/block-01.jpg",
        alt: "Interview feature header"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/exclusive-interview-with-high-visibility-congressperson/block-02.jpg",
          alt: "Congress coverage notes"
        },
        right: {
          src: "/assets/projects/exclusive-interview-with-high-visibility-congressperson/block-03.jpg",
          alt: "Primary challenge timeline"
        }
      },
      {
        type: "quote",
        text: "Access reporting is only useful when it clarifies democratic stakes for ordinary readers.",
        attribution: "Calvin Chimes reporting"
      }
    ],
    links: [
      {
        label: "Rep. Meijer Interview Coverage",
        url: "https://calvinchimes.org/2021/04/08/rep-meijer-defends-filibuster-merit-based-immigration-vote-for-impeachment/"
      }
    ]
  },
  {
    slug: "sustainable-development-health-access-report",
    title: "Sustainable Development and Health Access Report",
    intro:
      "Produced strategy and narrative work around health access, then authored an internal report to align teams on policy direction.",
    roles: ["Strategy", "Research", "Communications"],
    heroSrc: "/assets/projects/sustainable-development-health-access-report/hero.jpg",
    blocks: [
      {
        type: "image",
        src: "/assets/projects/sustainable-development-health-access-report/block-01.jpg",
        alt: "Health access report"
      },
      {
        type: "double",
        left: {
          src: "/assets/projects/sustainable-development-health-access-report/block-02.jpg",
          alt: "Sustainable development collaboration"
        },
        right: {
          src: "/assets/projects/sustainable-development-health-access-report/block-03.jpg",
          alt: "Program outcomes"
        }
      },
      {
        type: "quote",
        text: "Strategic clarity turned sustainable development from a slogan into an operational agenda.",
        attribution: "Internal report"
      }
    ],
    links: [
      {
        label: "Boehringer Sustainable Development",
        url: "https://www.boehringer-ingelheim.com/us/about-us/sustainable-development"
      }
    ]
  }
];

export const FEATURED_FEED_PICKS: Array<{ type: "linkedin" | "photo"; id: string }> = [];

const toTime = (value?: string): number => {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const interleaveByDate = <
  L extends { type: "linkedin"; dateValue: number },
  P extends { type: "photo"; dateValue: number }
>(
  linkedinItems: L[],
  photoItems: P[]
): Array<L | P> => {
  const output: Array<L | P> = [];
  let li = 0;
  let pi = 0;

  const firstIsLinkedIn = (linkedinItems[0]?.dateValue ?? 0) >= (photoItems[0]?.dateValue ?? 0);
  let nextType: "linkedin" | "photo" = firstIsLinkedIn ? "linkedin" : "photo";

  while (li < linkedinItems.length || pi < photoItems.length) {
    if (nextType === "linkedin") {
      if (li < linkedinItems.length) {
        output.push(linkedinItems[li]);
        li += 1;
      } else if (pi < photoItems.length) {
        output.push(photoItems[pi]);
        pi += 1;
      }
      nextType = "photo";
      continue;
    }

    if (pi < photoItems.length) {
      output.push(photoItems[pi]);
      pi += 1;
    } else if (li < linkedinItems.length) {
      output.push(linkedinItems[li]);
      li += 1;
    }
    nextType = "linkedin";
  }

  return output;
};

export const getFeedItems = (): FeedItem[] => {
  const featuredPhotos = PHOTOS.filter((photo) => photo.featured);
  const fallbackPhotoCount = 10;
  const photosForFeed =
    featuredPhotos.length > 0
      ? featuredPhotos
      : [...PHOTOS].sort((a, b) => toTime(b.takenDate) - toTime(a.takenDate)).slice(0, fallbackPhotoCount);

  const linkedinSorted = [...LINKEDIN_POSTS]
    .sort((a, b) => toTime(b.date) - toTime(a.date))
    .map((item) => ({ ...item, type: "linkedin" as const, dateValue: toTime(item.date) }));

  const photosSorted = [...photosForFeed]
    .sort((a, b) => toTime(b.takenDate) - toTime(a.takenDate))
    .map((item) => ({ ...item, type: "photo" as const, dateValue: toTime(item.takenDate) }));

  return interleaveByDate(linkedinSorted, photosSorted).map((item) => {
    const { dateValue, ...rest } = item;
    void dateValue;
    return rest;
  });
};

export const getProject = (slug: string): Project | undefined => PROJECTS.find((project) => project.slug === slug);

export const getAdjacentProjectSlugs = (
  slug: string
): {
  previous: string;
  next: string;
} => {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  const safeIndex = index < 0 ? 0 : index;
  const previous = PROJECTS[(safeIndex - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(safeIndex + 1) % PROJECTS.length];

  return {
    previous: previous.slug,
    next: next.slug
  };
};
