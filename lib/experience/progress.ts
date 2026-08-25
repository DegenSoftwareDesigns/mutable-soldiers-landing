export type ExperienceProgressListener = (
  progress: number,
  previousProgress: number,
) => void;

export type ExperienceProgressSignal = {
  get: () => number;
  set: (progress: number) => void;
  subscribe: (listener: ExperienceProgressListener) => () => void;
};

export function createExperienceProgressSignal(
  initialProgress = 0,
): ExperienceProgressSignal {
  let progress = initialProgress;
  const listeners = new Set<ExperienceProgressListener>();

  return {
    get: () => progress,
    set: (nextProgress) => {
      if (Math.abs(nextProgress - progress) < 0.00001) return;
      const previousProgress = progress;
      progress = nextProgress;
      listeners.forEach((listener) => listener(progress, previousProgress));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
