import {
  type MutationFunction,
  type MutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { useUX } from '@/context/UXContext';

import { toaster } from '@/components/ui/toaster';

type QueryKey = Array<string | Record<string, string | boolean>>;

const useMutationOptions = () => {
  const { setIOState } = useUX();
  const queryClient = useQueryClient();

  return {
    getMutationOptions<TBody, TRes, TCache>({
      mutationFn,
      queryKey,
      cancelKeys,
      optimisticUpdate,
      onSuccess = res => {
        console.log('Mutation success:', res);
        setIOState('SAVED');
      },
    }: {
      mutationFn: MutationFunction<TRes, TBody>;
      queryKey: QueryKey;
      cancelKeys?: QueryKey[];
      optimisticUpdate: (
        newValue: TBody,
        previousValues: TCache | undefined
      ) => TCache;
      onSuccess?: (res: TRes) => void;
    }): MutationOptions<TRes, void, TBody> {
      return {
        mutationFn,
        async onMutate(newValue) {
          setIOState("SAVING");
          // Cancel any outgoing refetches
          await Promise.all(
            (cancelKeys ?? [queryKey]).map(async (q) =>
              queryClient.cancelQueries({ queryKey: q })
            )
          );
          // Snapshot the previous value
          const previousValues = queryClient.getQueryData<TCache>(queryKey);
          // Optimistically update to the new value
          const updatedValues = optimisticUpdate(newValue, previousValues);
          queryClient.setQueryData(queryKey, updatedValues);
          return { previousValues };
        },
        onError(_err, _new, context) {
          setIOState('ERROR');
          console.error('Mutation error:', _err);
          console.error('Mutation error _new:', _new);
          queryClient.setQueryData(
            queryKey,
            (context as { previousValues: TCache })?.previousValues
          );
          toaster.create({
            title: 'Error saving',
            description: 'Please try again.',
            type: 'error',
            duration: 3000,
            closable: true,
          });
        },
        async onSuccess(res) {
          onSuccess(res);
          return queryClient.invalidateQueries({ queryKey }).then(() => {
            setIOState('SAVED');
          });
        },
      };
    },
  };
};

export default useMutationOptions;