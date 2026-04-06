import {
  UseMutationResult,
  useMutation,
  UseMutationOptions,
  MutationFunction,
} from '@tanstack/react-query';

const useSyncMutation = <
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn' | 'mutationKey'
  >
): Omit<UseMutationResult<TData, TError, TVariables, TContext>, 'mutate' | 'mutateAsync'> & {
  mutate: (variables: TVariables, options?: Parameters<UseMutationResult<TData, TError, TVariables, TContext>['mutate']>[1]) => void;
  mutateAsync: (variables: TVariables, options?: Parameters<UseMutationResult<TData, TError, TVariables, TContext>['mutateAsync']>[1]) => Promise<TData>;
} => {
  const mutationResults = useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options,
  });

  return {
    ...mutationResults,
    mutate: (variables, options) => {
      if (!mutationResults.isPending) {
        mutationResults.mutate(variables, options);
      }
    },
    mutateAsync: (variables, options) => {
      if (!mutationResults.isPending) {
        return mutationResults.mutateAsync(variables, options);
      }
      return Promise.reject(new Error('Mutation is already in progress'));
    },
  };
};

export default useSyncMutation;