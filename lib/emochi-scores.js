// Score mapping from docs/notion-export/hackxperience.md ("Score Mapping" section).
// All characters start at 50; MBTI letters + Q21-23 lifestyle answers each nudge scores up/down.

export const CHARACTERS = {
  Cheer: { name: "Cheer", color: "#FFC53D", tint: "#FFF3D3" },
  Fear: { name: "Fear", color: "#A78BFA", tint: "#EDE6FE" },
  Stress: { name: "Buzzy", color: "#FF6B4A", tint: "#FFE4DC" },
  Tear: { name: "Tear", color: "#4A90D9", tint: "#DCEBFB" },
  Calm: { name: "Zen", color: "#5FD4C4", tint: "#DFF9F4" },
  Social: { name: "Bubble", color: "#F97316", tint: "#FFEDD9" },
  Rest: { name: "Dozy", color: "#6C7A96", tint: "#E4E8F2" },
};

const MBTI_TRAIT_EFFECTS = {
  I: { increase: { Calm: 3, Rest: 2 }, decrease: { Social: 2 } },
  E: { increase: { Social: 3, Cheer: 2 }, decrease: { Rest: 2 } },
  S: { increase: { Fear: 3, Stress: 2 }, decrease: { Cheer: 2 } },
  N: { increase: { Cheer: 3, Calm: 2 }, decrease: { Fear: 2 } },
  T: { increase: { Calm: 3, Stress: 2 }, decrease: { Tear: 2 } },
  F: { increase: { Tear: 3, Social: 2 }, decrease: { Stress: 2 } },
  J: { increase: { Stress: 3, Fear: 2 }, decrease: { Rest: 2 } },
  P: { increase: { Rest: 3, Cheer: 2 }, decrease: { Stress: 2 } },
};

const SLEEP_EFFECTS = {
  lt5: { increase: { Rest: 3, Stress: 2 }, decrease: { Calm: 2 } },
  "5to6": { increase: { Rest: 2 }, decrease: { Cheer: 1 } },
  "7to9": { increase: { Calm: 3, Cheer: 2 }, decrease: { Stress: 2 } },
  gt9: { increase: { Rest: 2, Calm: 1 }, decrease: { Stress: 2 } },
};

const STRESS_EFFECTS = {
  very_relaxed: { increase: { Calm: 3, Cheer: 2 }, decrease: { Stress: 2 } },
  slightly_stressful: { increase: { Stress: 1 }, decrease: {} },
  quite_stressful: { increase: { Stress: 2, Fear: 1 }, decrease: { Calm: 2 } },
  extremely_stressful: { increase: { Stress: 3, Fear: 2 }, decrease: { Cheer: 2 } },
};

const SOCIAL_TIME_EFFECTS = {
  rarely: { increase: { Tear: 2, Rest: 1 }, decrease: { Social: 3 } },
  sometimes: { increase: { Social: 1 }, decrease: {} },
  often: { increase: { Social: 3, Cheer: 2 }, decrease: { Tear: 2 } },
  very_often: { increase: { Social: 5, Cheer: 3 }, decrease: { Fear: 2 } },
};

function applyEffects(scores, effects) {
  if (!effects) return;
  for (const [role, delta] of Object.entries(effects.increase ?? {})) {
    scores[role] += delta;
  }
  for (const [role, delta] of Object.entries(effects.decrease ?? {})) {
    scores[role] -= delta;
  }
}

function clamp(score) {
  return Math.max(0, Math.min(100, score));
}

export function computeEmochiScores(result) {
  const scores = Object.fromEntries(Object.keys(CHARACTERS).map((role) => [role, 50]));

  for (const letter of result.mbti.split("")) {
    applyEffects(scores, MBTI_TRAIT_EFFECTS[letter]);
  }
  applyEffects(scores, SLEEP_EFFECTS[result.sleep]);
  applyEffects(scores, STRESS_EFFECTS[result.stress]);
  applyEffects(scores, SOCIAL_TIME_EFFECTS[result.socialTime]);

  for (const role of Object.keys(scores)) {
    scores[role] = clamp(scores[role]);
  }

  return scores;
}
