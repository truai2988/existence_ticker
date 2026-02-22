// Singleton trigger for PWA install banner to avoid passing props deeply
export let globalTriggerPWAInstall = () => {};

export const setGlobalTriggerPWAInstall = (trigger: () => void) => {
    globalTriggerPWAInstall = trigger;
};
