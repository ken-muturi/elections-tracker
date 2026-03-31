/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, type FC } from 'react';
import { type FieldHookConfig, useField } from 'formik';
import {
  Field,
  type BoxProps,
} from '@chakra-ui/react';
import { Editor } from '@tinymce/tinymce-react';

type FormikFieldProps = {
  label?: string;
  type?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: string;
  placeholder?: string;
  value?: string;
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
} & BoxProps;

const plugins = [
  "advlist autolink lists link image charmap print preview anchor",
  "searchreplace visualblocks code fullscreen",
  "insertdatetime media table paste code help wordcount"
];

const toolbar = "undo redo | formatselect | " +
  "bold italic backcolor | alignleft aligncenter " +
  "alignright alignjustify | bullist numlist outdent indent | " +
  "removeformat | help";

const contentStyle = "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }";

const CustomTinyMCE: FC<FieldHookConfig<string> & FormikFieldProps> = ({
  label,
  hint,
  required = false,
  ...props
}) => {
  const editorRef = useRef<Editor | null>(null);
  const [field, meta, helpers] = useField({ ...props, value: props.value ?? '' });
  return (
    <Field.Root
      required={required}
      invalid={meta.touched && Boolean(meta.error)}
    >
      {label && (
        <Field.Label
          htmlFor={`${field.name}`}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, '')}-label`}
        >
          {label}
        </Field.Label>
      )}
      <Editor
        ref={editorRef}
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY!}
        initialValue={field.value ?? ''}
        init={{
          height: 400,
          menubar: false,
          content_style: contentStyle,
          plugins,
          toolbar,
          paste_data_images: true,
          image_uploadtab: true,
          images_file_types: "jpeg,jpg",
          images_upload_handler: (blobInfo: any) => {
            const base64str =
              "data:" +
              blobInfo.blob().type +
              ";base64," +
              blobInfo.base64();
            return Promise.resolve(base64str);
          },
        }}
        onEditorChange={(content: any) => {
          helpers.setValue(content);
        }}
      />
      {meta.error && meta.touched && (
        <Field.ErrorText
          id={`${label ?? ''}-${field.name.replace(/[^a-z0-9]/gi, '')}-message`}
        >
          {meta.error}
        </Field.ErrorText>
      )}
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
};

export default CustomTinyMCE;
