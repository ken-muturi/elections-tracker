/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"

export type SubmissionAnswerInput = {
    answer: string
    questionId: string
}

export const getAnswers = async (whereClause?: Record<string, any>, hasChildren = false) => {
    const where = whereClause ? whereClause : {}
    const include = hasChildren ? { question: true } : {}
    try {
        return await prisma.answer.findMany({
            where,
            include
        });
    } catch (error) {
    const message = handleReturnError(error);
    console.error("Error getting answers:", message);
    throw new Error(message);
    }
}

export const getAnswersBySubmission = async (submissionId: string) => {
    try {
        return await prisma.answer.findMany({
            where: { submissionId },
            include: { question: true },
        })
    } catch (error) {
        const message = handleReturnError(error);
        console.error("Error getting answers by submission:", message);
        throw new Error(message);
    }
}

export const saveAnswers = async (
    answers: SubmissionAnswerInput[],
    questionnaireId: string,
    pollingStationId?: string,
    existingSubmissionId?: string
) => {
    try {
        const user = await getCurrentUser()

        await prisma.$transaction(async (tx) => {
            let submissionId = existingSubmissionId

            if (!submissionId) {
                const dataEntryNumber = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
                const submission = await tx.submission.create({
                    data: {
                        questionnaireId,
                        pollingStationId: pollingStationId || null,
                        dataEntryNumber,
                        submittedBy: user.id,
                        status: "PENDING",
                    },
                })
                submissionId = submission.id
            }

            const answerData = answers.map((a) => ({
                submissionId: submissionId!,
                questionId: a.questionId,
                answer: a.answer,
            }))

            await tx.answer.createMany({ data: answerData, skipDuplicates: true })
        })
    } catch (error) {
        const message = handleReturnError(error);
        console.error("Error saving answers:", message);
        throw new Error(message);
    }
}