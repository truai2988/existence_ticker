export interface Chapter {
  id: number;
  title: string;
  fragment: string;
  annotation?: string;
  content: string[];
}

export const STORY_TITLE = "";

export const CHAPTERS: Chapter[] = [];
