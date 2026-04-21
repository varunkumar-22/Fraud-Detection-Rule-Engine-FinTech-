export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export const SCORE_THRESHOLDS = {
  REVIEW: 30,
  BLOCK:  70,
} as const;

export const ALERT_SCORE_THRESHOLD = 70;

export const VELOCITY_WINDOWS = {
  ONE_HOUR:        60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
} as const;
