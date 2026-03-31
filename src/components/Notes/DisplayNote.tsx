import { Box, Button, HStack, Text, VStack,IconButton } from '@chakra-ui/react'
import React, { useState } from 'react'
import { FaComment } from "react-icons/fa6";
import { MdDeleteForever } from "react-icons/md";
import { timeAgo } from "@/utils/util";

import AddNote from './AddNote';
import { useQueryClient } from '@tanstack/react-query';
import { NestedNote } from "./index";
import { getNoteById } from "@/services/Notes";
import { NoteWithRelation } from './type';

type NotesDisplayProps = {
  note: NestedNote;
  level: number;
  model: string;
  modelId: string;
};

const DisplayNote = ({ note, model, modelId, level}: NotesDisplayProps) => {
  const [replyToNote, setReplyToNote] = useState(false);
  const queryClient = useQueryClient();
  const hasReplies = note.replies && note.replies.length > 0
  const indent = level > 0 ? Math.min(level * 4, 16) : 0;

  const deleteNote = async (id: string) => {
    await getNoteById(id);
    await queryClient.refetchQueries({
      queryKey: ["notes", { model, id: modelId }],
    });
  };

  return (
    <Box w="full" py={2}>
      <VStack 
        fontSize="xs"
        p={2} 
        bg="gray.50"
        gap={2} 
        alignItems="left"
        borderWidth={1}
        borderColor="gray.200"
        borderRadius="lg"
        w="full"
        ml={indent}
      >        
        <Text fontSize="xs">{note.note}</Text>
        <Text fontSize="xs">
          {timeAgo(new Date(note.createdAt))} by {note.creator.firstname} {note.creator.othernames}{" "}
        </Text>
        <HStack fontSize="xs" gap={2}>
          {hasReplies && (
            <Box as="span">
              {note.replies.length} {note.replies.length === 1 ? 'reply' : 'replies'}
            </Box>
          )}
          <HStack gap={1}>
            <IconButton
              aria-label="Reply to note"
              variant="ghost"
              color="blue.600"
              onClick={() => setReplyToNote(!replyToNote)}
            >
              <FaComment />
            </IconButton>
            <Text as="span" ml={1} fontSize="xs">Reply</Text>
          </HStack>

          {!hasReplies && (
            <Button
              size="xs"
              variant="solid"
              color="red.600"
              onClick={() => deleteNote(note.id)}
            >
              <MdDeleteForever />
              Delete
            </Button>
          )}
        </HStack>
      </VStack>
        {hasReplies && (
          <>
          {note.replies.map((reply: NoteWithRelation) => (
              <DisplayNote
                model={model}
                modelId={modelId}
                key={reply.id}
                note={reply}
                level={level + 1}
              />
            ))}
          </>
        )}
        {replyToNote && (
          <AddNote
            model={model}
            placeholder="Add reply"
            parentId={note.id}
            modelId={modelId}
          />
        )}
    </Box>
  );
};

export default DisplayNote