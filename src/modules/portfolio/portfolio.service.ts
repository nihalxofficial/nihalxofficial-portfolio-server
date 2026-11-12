import { AboutModel } from "../about/about.model";
import { BlogPostModel } from "../posts/posts.model";
import { CertificationModel } from "../certifications/certifications.model";
import { EducationModel } from "../education/education.model";
import { ExperienceModel } from "../experience/experience.model";
import { HeroModel } from "../hero/hero.model";
import { NavigationModel } from "../navigation/navigation.model";
import { ProjectModel } from "../projects/projects.model";
import { SectionModel } from "../sections/sections.model";
import { ServiceModel } from "../services/services.model";
import { SiteSettingsModel } from "../settings/settings.model";
import { SkillModel } from "../skills/skills.model";
import { StatisticModel } from "../statistics/statistics.model";
import { TestimonialModel } from "../testimonials/testimonials.model";

export interface SkillGroup {
  category: string;
  skills: Array<{
    id: string;
    name: string;
    icon: string;
    brandColor: string;
    proficiency: string;
  }>;
}

export async function getPortfolioContent() {
  const [
    hero,
    about,
    statistics,
    skills,
    services,
    projects,
    experience,
    education,
    certifications,
    testimonials,
    posts,
    navigation,
    settings,
    sections,
  ] = await Promise.all([
    HeroModel.findOne({ key: "main" }).lean(),
    AboutModel.findOne({ key: "main" }).lean(),
    StatisticModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    SkillModel.find({ isVisible: true }).sort({ category: 1, order: 1 }).lean(),
    ServiceModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    ProjectModel.find({ isPublished: true }).sort({ order: 1, createdAt: -1 }).lean(),
    ExperienceModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    EducationModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    CertificationModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    TestimonialModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    BlogPostModel.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(6).lean(),
    NavigationModel.find({ isVisible: true }).sort({ order: 1 }).lean(),
    SiteSettingsModel.findOne({ key: "main" }).lean(),
    SectionModel.find().sort({ order: 1 }).lean(),
  ]);

  const skillsByCategory: SkillGroup[] = [];
  for (const skill of skills) {
    let group = skillsByCategory.find((item) => item.category === skill.category);
    if (!group) {
      group = { category: skill.category, skills: [] };
      skillsByCategory.push(group);
    }
    group.skills.push({
      id: String(skill._id),
      name: skill.name,
      icon: skill.icon ?? "",
      brandColor: skill.brandColor ?? "",
      proficiency: skill.proficiency ?? "",
    });
  }

  return {
    hero,
    about,
    statistics,
    skills: skillsByCategory,
    services,
    projects,
    experience,
    education,
    certifications,
    testimonials,
    posts,
    navigation,
    settings,
    sections,
  };
}

export async function getFeaturedProjects(limit = 4) {
  return ProjectModel.find({ isPublished: true, isFeatured: true })
    .sort({ order: 1, createdAt: -1 })
    .limit(limit)
    .lean();
}

/** Detail page for one project plus a short "keep reading" list. */
export async function getProjectBySlug(slug: string) {
  const project = await ProjectModel.findOne({ slug, isPublished: true }).lean();
  if (!project) return null;

  const related = await ProjectModel.find({ isPublished: true, slug: { $ne: slug } })
    .sort({ order: 1, createdAt: -1 })
    .limit(3)
    .lean();

  return { project, related };
}

export async function getPostBySlug(slug: string) {
  const post = await BlogPostModel.findOne({ slug, isPublished: true }).lean();
  if (!post) return null;

  const related = await BlogPostModel.find({ isPublished: true, slug: { $ne: slug } })
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();

  return { post, related };
}
