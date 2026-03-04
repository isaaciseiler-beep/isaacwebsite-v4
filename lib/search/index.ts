import { LINKEDIN_POSTS, PHOTOS, PROJECTS, SITE, getFeedItems } from "@/lib/content";
import { computeStableHash } from "@/lib/search/hash";

export type SearchDoc = {
  id: string;
  type: "page" | "project" | "block" | "photo" | "linkedin" | "contact";
  title: string;
  body: string;
  url: string;
  anchor?: string;
  breadcrumbs?: string[];
  tags?: string[];
  date?: string;
  imageSrc?: string;
};

const ABOUT_TITLE = "Short bio and current focus";

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

const slugify = (value: string): string =>
  normalizeSpaces(
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  ) || "section";

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const getProjectSummaryAnchor = (slug: string): string => `cs-${slugify(slug)}-summary`;

export const getProjectBlockAnchor = (slug: string, blockIndex: number): string =>
  `cs-${slugify(slug)}-block-${pad2(blockIndex + 1)}`;

export const getPhotoAnchor = (photoId: string): string => {
  if (photoId.startsWith("photo-")) {
    return photoId;
  }

  return `photo-${photoId}`;
};

export const getFeedAnchor = (feedId: string): string => `feed-${slugify(feedId)}`;

const ABOUT_PARAGRAPHS = SITE.aboutMarkdown
  .split("\n\n")
  .map((paragraph) => normalizeSpaces(paragraph))
  .filter(Boolean);

const buildTopLevelPageDocs = (): SearchDoc[] => {
  return [
    {
      id: "page-home",
      type: "page",
      title: "Home feed and projects",
      body: "Homepage with a feed of LinkedIn posts and photos, plus the projects list and contact access.",
      url: "/",
      breadcrumbs: ["Home"],
      tags: ["home", "feed", "projects", "contact"]
    },
    {
      id: "page-playground",
      type: "page",
      title: "Playground photo album",
      body: "Interactive photo album with location filters, modal navigation, and metadata by album and date.",
      url: "/playground",
      breadcrumbs: ["Playground"],
      tags: ["playground", "photos", "album", "location"]
    }
  ];
};

const buildAboutDocs = (): SearchDoc[] => {
  const docs: SearchDoc[] = [
    {
      id: "about-overview",
      type: "page",
      title: "About",
      body: `${ABOUT_TITLE}. ${ABOUT_PARAGRAPHS.join(" ")}`,
      url: "/about",
      anchor: "about-overview",
      breadcrumbs: ["About"],
      tags: ["about", "bio", "background"]
    }
  ];

  ABOUT_PARAGRAPHS.forEach((paragraph, index) => {
    const anchor = `about-bio-${pad2(index + 1)}`;
    docs.push({
      id: anchor,
      type: "page",
      title: `About bio ${pad2(index + 1)}`,
      body: paragraph,
      url: "/about",
      anchor,
      breadcrumbs: ["About", "Bio"],
      tags: ["about", "bio", "focus"]
    });
  });

  return docs;
};

const buildProjectDocs = (): SearchDoc[] => {
  const docs: SearchDoc[] = [];

  PROJECTS.forEach((project) => {
    const summaryAnchor = getProjectSummaryAnchor(project.slug);

    docs.push({
      id: `project-${project.slug}`,
      type: "project",
      title: project.title,
      body: `${project.intro} Roles: ${project.roles.join(", ")}. ${project.links?.map((link) => `${link.label} ${link.url}`).join(". ") ?? ""}`,
      url: `/case-study/${project.slug}`,
      anchor: summaryAnchor,
      breadcrumbs: ["Projects", project.title],
      tags: ["project", ...project.roles, project.slug.replace(/-/g, " ")],
      imageSrc: project.heroSrc
    });

    project.blocks.forEach((block, blockIndex) => {
      const anchor = getProjectBlockAnchor(project.slug, blockIndex);
      const blockLabel = pad2(blockIndex + 1);

      if (block.type === "quote") {
        docs.push({
          id: `project-${project.slug}-block-${blockLabel}`,
          type: "block",
          title: `${project.title} quote ${blockLabel}`,
          body: `${block.text}${block.attribution ? ` — ${block.attribution}` : ""}`,
          url: `/case-study/${project.slug}`,
          anchor,
          breadcrumbs: ["Projects", project.title, `Block ${blockLabel}`],
          tags: ["quote", "case study", ...project.roles]
        });
        return;
      }

      if (block.type === "image") {
        docs.push({
          id: `project-${project.slug}-block-${blockLabel}`,
          type: "block",
          title: `${project.title} image ${blockLabel}`,
          body: block.alt ? `Image caption: ${block.alt}` : `${project.title} case-study image`,
          url: `/case-study/${project.slug}`,
          anchor,
          breadcrumbs: ["Projects", project.title, `Block ${blockLabel}`],
          tags: ["image", "case study", ...project.roles],
          imageSrc: block.src
        });
        return;
      }

      docs.push({
        id: `project-${project.slug}-block-${blockLabel}`,
        type: "block",
        title: `${project.title} gallery ${blockLabel}`,
        body: `Left image: ${block.left.alt ?? project.title}. Right image: ${block.right.alt ?? project.title}.`,
        url: `/case-study/${project.slug}`,
        anchor,
        breadcrumbs: ["Projects", project.title, `Block ${blockLabel}`],
        tags: ["image", "gallery", "case study", ...project.roles],
        imageSrc: block.left.src
      });
    });
  });

  return docs;
};

const buildLinkedInDocs = (): SearchDoc[] => {
  return LINKEDIN_POSTS.map((post) => ({
    id: post.id,
    type: "linkedin",
    title: post.title,
    body: `${post.excerpt} Date: ${post.date}.`,
    url: post.url,
    anchor: getFeedAnchor(post.id),
    breadcrumbs: ["Home", "Feed", "LinkedIn"],
    tags: ["linkedin", "feed", "post"],
    date: post.date,
    imageSrc: post.coverSrc
  }));
};

const buildPhotoDocs = (): SearchDoc[] => {
  const docs: SearchDoc[] = [];

  PHOTOS.forEach((photo) => {
    docs.push({
      id: photo.id,
      type: "photo",
      title: photo.location,
      body: `${photo.alt}. Album: ${photo.album}. Location: ${photo.location}.`,
      url: `/playground?photo=${encodeURIComponent(photo.id)}`,
      anchor: getPhotoAnchor(photo.id),
      breadcrumbs: ["Playground", photo.album],
      tags: ["photo", "photography", photo.location, photo.album],
      date: photo.takenDate,
      imageSrc: photo.src
    });
  });

  const feedItems = getFeedItems();
  feedItems.forEach((item) => {
    if (item.type !== "photo") {
      return;
    }

    docs.push({
      id: `feed-${item.id}`,
      type: "photo",
      title: `${item.location} (feed)`,
      body: `${item.alt}. Featured on homepage feed. Album: ${item.album}.`,
      url: `/?feed=${encodeURIComponent(item.id)}`,
      anchor: getFeedAnchor(item.id),
      breadcrumbs: ["Home", "Feed", "Photos"],
      tags: ["feed", "photo", item.location, item.album],
      date: item.takenDate,
      imageSrc: item.src
    });
  });

  return docs;
};

const buildContactDocs = (): SearchDoc[] => {
  return [
    {
      id: "contact-main",
      type: "contact",
      title: "Contact Isaac Seiler",
      body: `Email ${SITE.email}. LinkedIn ${SITE.linkedinUrl}. GitHub ${SITE.githubUrl}. Resume ${SITE.resumePdfPath}.`,
      url: "#contact",
      breadcrumbs: ["Contact"],
      tags: ["contact", "email", "linkedin", "github", "resume", "cv"]
    }
  ];
};

export const buildSearchIndex = (): SearchDoc[] => {
  return [
    ...buildTopLevelPageDocs(),
    ...buildAboutDocs(),
    ...buildProjectDocs(),
    ...buildLinkedInDocs(),
    ...buildPhotoDocs(),
    ...buildContactDocs()
  ];
};

export const INDEX_VERSION = computeStableHash({
  site: SITE,
  projects: PROJECTS,
  photos: PHOTOS,
  linkedin: LINKEDIN_POSTS,
  feed: getFeedItems()
});

const hasProtocol = (value: string): boolean => /^[a-z]+:\/\//i.test(value);

export const toDocHref = (doc: SearchDoc): string => {
  if (doc.type === "contact") {
    return "/?contact=open#contact";
  }

  if (doc.type === "linkedin") {
    return `/?feed=${encodeURIComponent(doc.id)}#${doc.anchor ?? getFeedAnchor(doc.id)}`;
  }

  if (hasProtocol(doc.url)) {
    return doc.url;
  }

  if (!doc.anchor) {
    return doc.url;
  }

  return `${doc.url}#${doc.anchor}`;
};

export const toCitationUrl = (doc: SearchDoc): string => {
  if (doc.type === "linkedin") {
    return doc.url;
  }

  return toDocHref(doc);
};
