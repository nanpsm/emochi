// Interest categories from docs/notion-export/hackxperience.md ("Interests" section).
// Users pick up to 5 so Emochi can personalize conversations, suggestions, and support.

export const MAX_INTERESTS = 5;

export const INTEREST_CATEGORIES = [
  {
    name: "Entertainment",
    items: ["Music", "Movies & TV", "Gaming", "Anime", "Reading"],
  },
  {
    name: "Sports & Fitness",
    items: ["Gym", "Running", "Walking", "Cycling", "Dancing", "Yoga"],
  },
  {
    name: "Creativity",
    items: ["Drawing", "Photography", "Writing", "Cooking", "Baking"],
  },
  {
    name: "Learning & Career",
    items: ["Coding", "AI & Technology", "Studying", "Business", "Language Learning"],
  },
  {
    name: "Social",
    items: ["Friends", "Family", "Volunteering", "Networking"],
  },
  {
    name: "Relaxation",
    items: ["Meditation", "Journaling", "Nature", "Pets", "Gardening"],
  },
  {
    name: "Travel & Lifestyle",
    items: ["Traveling", "Shopping", "Fashion", "Cafés", "Food Exploration"],
  },
];
