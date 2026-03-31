import React, { useMemo } from 'react'
import { Box, VStack, Spinner, Center, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import AddNote from './AddNote'
import DisplayNote from "./DisplayNote";
import { getNotes } from "@/services/Notes";
import { NoteWithRelation } from "./type";

export type NestedNote = {
  replies: NoteWithRelation[];
} & NoteWithRelation

type NoteProps = {
  model: string;
  modelId: string;
  title?: string;
};

const Notes = ({ title = "Discussions", model, modelId }: NoteProps) => {
  const { data: comments, isLoading } = useQuery({
    queryKey: ["notes", { model, id: modelId }],
    queryFn: async () => await getNotes(modelId, model) as unknown as NoteWithRelation[],
  });

  // Transform flat array into nested structure
  const nestedComments = useMemo(() => {
    const commentMap = new Map();
    const rootComments: NestedNote[] = [];

    // First pass: create map of all comments
    comments?.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    comments?.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }, [comments]);

  console.log("Nested Comments:", nestedComments);
  return (
    <VStack alignItems="start" w="full" gap={4}>
      <Box fontSize="lg">{title}</Box>
      {isLoading && (
        <Box w="full">
          <Center>
            <Spinner size="sm" />
          </Center>
        </Box>
      )}
      {nestedComments.map((note) => (
        <DisplayNote
          model={model}
          modelId={modelId}
          key={note.id}
          note={note}
          level={0}
        />
      ))}

      {nestedComments.length === 0 && (
        <Box textAlign="center" fontSize="sm" mt={4}>
          <Box w={4} h={4} bg="gray.200" />
          <Text fontSize="sm">No comments yet</Text>
        </Box>
      )}
      <AddNote model={model} placeholder={`Add ${title}`} modelId={modelId} />
    </VStack>
  );
};

export default Notes