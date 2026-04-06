"use client"

import { useState, useCallback } from "react"
import { Box, Text, VStack, HStack, Image, SimpleGrid } from "@chakra-ui/react"
import {
  FiCamera, FiTrash2, FiCheckCircle, FiAlertCircle, FiLoader,
} from "react-icons/fi"
import { useDropzone } from "react-dropzone"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import {
  getFormImageUploadUrl,
  saveResultFormImage,
  getFormImages,
  deleteResultFormImage,
} from "@/services/FormImages"
import { getFormTypeForLevel, getFormLabel } from "@/constants/elections"
import type { AggregationLevel } from "@prisma/client"

/* ── Types ──────────────────────────────────────────────────── */

type FormImage = {
  id: string
  formType: string
  imageUrl: string
  uploadedAt: Date
  notes: string | null
}

type FormImageUploadProps = {
  positionId: string
  positionType: string
  level: AggregationLevel
  entityId: string
}

/* ── Constants ──────────────────────────────────────────────── */

const ACCEPTED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/heic": [".heic"],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/* ── Component ──────────────────────────────────────────────── */

export default function FormImageUpload({
  positionId,
  positionType,
  level,
  entityId,
}: FormImageUploadProps) {
  const queryClient = useQueryClient()
  const queryKey = ["form-images", positionId, level, entityId]
  const formType = getFormTypeForLevel(positionType, level)
  const formLabel = getFormLabel(positionType, level)

  const [uploadError, setUploadError] = useState("")

  /* ── Existing images ────────────────────────────────────── */

  const { data: images = [] } = useQuery<FormImage[]>({
    queryKey,
    queryFn: () => getFormImages(positionId, level, entityId),
  })

  /* ── Upload mutation ────────────────────────────────────── */

  const uploadMutation = useSyncMutation(
    async (file: File) => {
      // 1. Get presigned URL from server
      const { uploadUrl, key } = await getFormImageUploadUrl(
        file.type,
        file.name,
      )

      // 2. Upload directly to S3
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!res.ok) throw new Error("Failed to upload image to storage")

      // 3. Save record in DB
      const record = await saveResultFormImage({
        positionId,
        level,
        entityId,
        formType,
        imageKey: key,
      })

      return record
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey })
        setUploadError("")
      },
    },
  )

  /* ── Delete mutation ────────────────────────────────────── */

  const deleteMutation = useSyncMutation(
    async (id: string) => deleteResultFormImage(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey })
      },
    },
  )

  /* ── Dropzone ───────────────────────────────────────────── */

  const onDrop = useCallback(
    (accepted: File[]) => {
      setUploadError("")
      const file = accepted[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        setUploadError("File too large. Maximum size is 10 MB.")
        return
      }

      uploadMutation.mutate(file)
    },
    [uploadMutation],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    multiple: false,
  })

  /* ── Error state ────────────────────────────────────────── */

  const error =
    uploadError ||
    uploadMutation.error?.message ||
    deleteMutation.error?.message ||
    ""

  const isPending = uploadMutation.isPending || deleteMutation.isPending

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <VStack gap={3} alignItems="stretch">
      {/* Section header */}
      <HStack gap={2}>
        <FiCamera fontSize="0.9rem" color="#64748b" />
        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide">
          {formLabel}
        </Text>
        {images.length > 0 && (
          <Text fontSize="xs" color="gray.400">
            · {images.length} image{images.length !== 1 ? "s" : ""}
          </Text>
        )}
      </HStack>

      {/* Existing images grid */}
      {images.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
          {images.map((img) => (
            <Box
              key={img.id}
              position="relative"
              borderRadius="lg"
              overflow="hidden"
              borderWidth="1px"
              borderColor="gray.100"
              bg="gray.50"
            >
              <Image
                src={img.imageUrl}
                alt={`${formType} form`}
                w="100%"
                h="120px"
                objectFit="cover"
                cursor="pointer"
                onClick={() => window.open(img.imageUrl, "_blank")}
              />
              <Box
                position="absolute"
                top={1}
                right={1}
                as="button"
                onClick={() => deleteMutation.mutate(img.id)}
                bg="rgba(0,0,0,0.5)"
                color="white"
                borderRadius="full"
                w={6}
                h={6}
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: "rgba(220,38,38,0.8)" }}
                transition="all 0.15s"
              >
                <FiTrash2 fontSize="0.65rem" />
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Upload dropzone */}
      <Box
        {...getRootProps()}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragActive ? "#0ea5e9" : "gray.200"}
        borderRadius="xl"
        bg={isDragActive ? "#f0f9ff" : "gray.50"}
        px={4}
        py={4}
        cursor="pointer"
        textAlign="center"
        transition="all 0.15s"
        _hover={{ borderColor: "#0ea5e9", bg: "#f0f9ff" }}
        opacity={isPending ? 0.6 : 1}
      >
        <input {...getInputProps()} />
        <VStack gap={1}>
          {uploadMutation.isPending ? (
            <>
              <FiLoader fontSize="1.2rem" color="#0ea5e9" className="animate-spin" />
              <Text fontSize="xs" color="gray.500">Uploading…</Text>
            </>
          ) : (
            <>
              <FiCamera fontSize="1.2rem" color="#94a3b8" />
              <Text fontSize="xs" color="gray.500">
                {isDragActive
                  ? "Drop the image here"
                  : "Tap to photograph or upload form image"}
              </Text>
              <Text fontSize="10px" color="gray.400">
                JPG, PNG or WebP · Max 10 MB
              </Text>
            </>
          )}
        </VStack>
      </Box>

      {/* Error message */}
      {error && (
        <Box px={3} py={2} bg="#fef2f2" borderRadius="lg">
          <HStack gap={1.5}>
            <FiAlertCircle fontSize="0.75rem" color="#dc2626" />
            <Text fontSize="xs" color="#dc2626">{error}</Text>
          </HStack>
        </Box>
      )}

      {/* Success on recent upload */}
      {!error && images.length > 0 && !uploadMutation.isPending && uploadMutation.isSuccess && (
        <Box px={3} py={2} bg="#d1fae5" borderRadius="lg">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.75rem" color="#065f46" />
            <Text fontSize="xs" color="#065f46" fontWeight="600">
              Form image uploaded
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  )
}
