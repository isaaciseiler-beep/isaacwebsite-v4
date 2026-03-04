import { notFound } from "next/navigation";
import CaseStudy from "@/components/CaseStudy";
import { PROJECTS, getAdjacentProjectSlugs, getProject } from "@/lib/content";

type CaseStudyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const resolvedParams = await params;
  const project = getProject(resolvedParams.slug);
  if (!project) {
    notFound();
  }

  const adjacent = getAdjacentProjectSlugs(project.slug);

  return <CaseStudy project={project} previousSlug={adjacent.previous} nextSlug={adjacent.next} />;
}
