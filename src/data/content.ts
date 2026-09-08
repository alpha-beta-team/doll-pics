// Portfolio media comes from published CMS records. Empty responses must not
// invent studio sessions, locations, years or authorship from stock photography.
export const heroSlides: Array<{ image: string; label: string }> = [];
export const storyScenes: Array<{ text: string; image: string }> = [];
export const featuredWork: Array<{
  title: string; category: string; image: string; alt: string; location: string; year: string;
}> = [];
export const galleryImages: Array<{ src: string; alt: string }> = [];

export const stats: Array<{ value: number; suffix: string; label: string }> = [];

/** Empty until real Erode/TN client quotes exist in CMS. */
export const testimonials: Array<{
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  likes: number;
  reply: string;
}> = [];

/** Empty until genuine process media is uploaded and approved. */
export const behindScenes: Array<{
  title: string;
  image: string;
  video?: string;
  description?: string;
}> = [];

/** Empty until current team members approve their profile and portrait. */
export const staffProfiles: Array<{
  name: string;
  jobTitle: string;
  bio: string;
  photo: string;
}> = [];
