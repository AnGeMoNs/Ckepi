export interface FieldTrialDraft {
  // Null keeps untouched defaults in sync with the chosen language.
  title: string | null;
  objective: string | null;
  equipment: string[];
  notes: string;
}

export function createFieldTrialDraft(): FieldTrialDraft {
  return {
    title: null,
    objective: null,
    equipment: ["imu_inclinometer", "open_microcontroller"],
    notes: "",
  };
}
