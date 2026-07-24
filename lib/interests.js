// Interest categories from docs/notion-export/hackxperience.md ("Interests" section).
// Users pick up to 5 so Emochi can personalize conversations, suggestions, and support.
// `icon` names are Google Material Symbols (Outlined) icon identifiers.

export const MAX_INTERESTS = 5;

export const INTEREST_CATEGORIES = [
  {
    name: "Entertainment",
    color: "#FFC53D",
    tint: "#FFF3D3",
    items: [
      { label: "Music", icon: "music_note" },
      { label: "Movies & TV", icon: "movie" },
      { label: "Gaming", icon: "sports_esports" },
      { label: "Anime", icon: "theater_comedy" },
      { label: "Reading", icon: "menu_book" },
    ],
  },
  {
    name: "Sports & Fitness",
    color: "#FF6B4A",
    tint: "#FFE4DC",
    items: [
      { label: "Gym", icon: "fitness_center" },
      { label: "Running", icon: "directions_run" },
      { label: "Walking", icon: "directions_walk" },
      { label: "Cycling", icon: "directions_bike" },
      { label: "Dancing", icon: "nightlife" },
      { label: "Yoga", icon: "self_improvement" },
    ],
  },
  {
    name: "Creativity",
    color: "#F97316",
    tint: "#FFEDD9",
    items: [
      { label: "Drawing", icon: "palette" },
      { label: "Photography", icon: "photo_camera" },
      { label: "Writing", icon: "edit" },
      { label: "Cooking", icon: "restaurant" },
      { label: "Baking", icon: "cake" },
    ],
  },
  {
    name: "Learning & Career",
    color: "#4A90D9",
    tint: "#DCEBFB",
    items: [
      { label: "Coding", icon: "code" },
      { label: "AI & Technology", icon: "smart_toy" },
      { label: "Studying", icon: "school" },
      { label: "Business", icon: "work" },
      { label: "Language Learning", icon: "translate" },
    ],
  },
  {
    name: "Social",
    color: "#A78BFA",
    tint: "#EDE6FE",
    items: [
      { label: "Friends", icon: "group" },
      { label: "Family", icon: "family_restroom" },
      { label: "Volunteering", icon: "volunteer_activism" },
      { label: "Networking", icon: "hub" },
    ],
  },
  {
    name: "Relaxation",
    color: "#5FD4C4",
    tint: "#DFF9F4",
    items: [
      { label: "Meditation", icon: "spa" },
      { label: "Journaling", icon: "book" },
      { label: "Nature", icon: "park" },
      { label: "Pets", icon: "pets" },
      { label: "Gardening", icon: "yard" },
    ],
  },
  {
    name: "Travel & Lifestyle",
    color: "#C9A857",
    tint: "#FBF3D9",
    items: [
      { label: "Traveling", icon: "flight" },
      { label: "Shopping", icon: "shopping_bag" },
      { label: "Fashion", icon: "checkroom" },
      { label: "Cafés", icon: "local_cafe" },
      { label: "Food Exploration", icon: "ramen_dining" },
    ],
  },
];
