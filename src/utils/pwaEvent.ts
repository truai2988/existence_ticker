// Singleton trigger for PWA install banner to avoid passing props deeply
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export let globalTriggerPWAInstall = (_force?: boolean) => {};

export const setGlobalTriggerPWAInstall = (trigger: (force?: boolean) => void) => {
    globalTriggerPWAInstall = trigger;
};
