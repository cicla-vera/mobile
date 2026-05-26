import type { MoodOption } from "@/types/calendar.types";

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "well",
    label: "Bem",
    image: require("@/assets/images/moods/mood-happy.png"),
  },
  {
    id: "tired",
    label: "Cansada",
    image: require("@/assets/images/moods/mood-tired.png"),
  },
  {
    id: "irritated",
    label: "Irritada",
    image: require("@/assets/images/moods/mood-angry.png"),
  },
  {
    id: "sad",
    label: "Triste",
    image: require("@/assets/images/moods/mood-sad.png"),
  },
  {
    id: "scared",
    label: "Com medo",
    icon: "alert-circle",
    iconColor: "#4A225E",
  },
];
