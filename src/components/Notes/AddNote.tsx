import React, { useState } from 'react'
import { Field, Input } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createNote, updateNote } from "@/services/Notes";

type AddNoteProps = {
  id?: string;
  model: string;
  modelId: string;
  parentId?: string;
  placeholder?: string;
};
const AddNote = ({
  id,
  model,
  parentId,
  modelId,
  placeholder,
}: AddNoteProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setValue(e.target.value);
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      if (value.trim().length > 2) {
        const noteParentId = parentId ? { parentId } : {};
        const note = {
          model,
          modelId,
          note: value,
          ...noteParentId,
        };
        if (id) {
          updateNote(id, note);
        } else {
          createNote(note);
        }
        await queryClient.refetchQueries({
          queryKey: ["notes", { model, id: modelId }],
        });
        setValue("");
      } else {
        setError("Note must be at least 3 characters");
      }
    }
  };

  return (
    <Field.Root invalid={Boolean(error)}>
      <Input
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Add a note"}
        size={"lg"}
        fontSize={"sm"}
        value={value}
      />
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};

export default AddNote