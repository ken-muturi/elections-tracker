"use server"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"
import type { AggregationLevel } from "@prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// S3 presigned URL
// ─────────────────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET!
const BUCKET_URL = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL!

function generateKey(ext: string): string {
  const rand = Math.random().toString(36).slice(2, 12)
  return `form-images/${rand}.${ext}`
}

/**
 * Generate a presigned PUT URL so the client can upload directly to S3.
 * Returns the upload URL and the S3 key (used to build the final URL).
 */
export async function getFormImageUploadUrl(contentType: string, filename: string) {
  try {
    const ext = filename.split(".").pop() ?? "jpg"
    const key = generateKey(ext)

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 120 })

    return { uploadUrl, key }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

export type SaveFormImageInput = {
  positionId: string
  level: AggregationLevel
  entityId: string
  formType: string
  imageKey: string
  notes?: string
}

/**
 * Save a form-image record after the client has uploaded to S3.
 */
export async function saveResultFormImage(input: SaveFormImageInput) {
  try {
    const user = await getCurrentUser()

    const imageUrl = `${BUCKET_URL}${input.imageKey}`

    const record = await prisma.resultFormImage.create({
      data: {
        positionId: input.positionId,
        level: input.level,
        entityId: input.entityId,
        formType: input.formType,
        imageUrl,
        uploadedBy: user.id,
        notes: input.notes,
      },
    })

    return record
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * List all form images for a given entity at a specific level + position.
 */
export async function getFormImages(
  positionId: string,
  level: AggregationLevel,
  entityId: string,
) {
  try {
    return await prisma.resultFormImage.findMany({
      where: { positionId, level, entityId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        formType: true,
        imageUrl: true,
        uploadedAt: true,
        notes: true,
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Delete a form image record (and the caller should also clean up S3 if needed).
 */
export async function deleteResultFormImage(id: string) {
  try {
    const user = await getCurrentUser()

    // Verify ownership
    const record = await prisma.resultFormImage.findUnique({ where: { id } })
    if (!record) throw new Error("Image not found")
    if (record.uploadedBy !== user.id) throw new Error("Not authorized to delete this image")

    await prisma.resultFormImage.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
