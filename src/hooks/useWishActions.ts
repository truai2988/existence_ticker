import { useCreateWish } from "./wishes/useCreateWish";
import { useWishApplication } from "./wishes/useWishApplication";
import { useWishLifecycle } from "./wishes/useWishLifecycle";

/**
 * Facade hook for wish actions.
 * Aggregates all modular wish hooks to maintain backward compatibility with 
 * components that previously relied on the monolithic useWishActions hook.
 */
export const useWishActions = () => {
  const createAPI = useCreateWish();
  const applyAPI = useWishApplication();
  const lifecycleAPI = useWishLifecycle();

  return {
    ...createAPI,
    ...applyAPI,
    ...lifecycleAPI,
    isSubmitting: createAPI.isSubmitting || applyAPI.isSubmitting || lifecycleAPI.isSubmitting
  };
};
