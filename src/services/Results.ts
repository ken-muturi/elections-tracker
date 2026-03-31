/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"

export type ResultSummary = {
  questionId: string
  questionTitle: any[]
  totalValue: number
  submissions: number
  byStation: {
    stationId: string
    stationName: string
    stationCode: string
    county: string
    constituency: string
    ward: string
    value: number
  }[]
}

export type ElectionDashboardData = {
  questionnaireId: string
  questionnaireTitle: any[]
  totalSubmissions: number
  totalStations: number
  stationsReported: number
  results: ResultSummary[]
  submissionsByStatus: { status: string; count: number }[]
  recentSubmissions: any[]
}

export const getElectionResults = async (
  questionnaireId: string
): Promise<ElectionDashboardData> => {
  try {
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        sections: {
          include: {
            units: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    })

    if (!questionnaire) {
      throw new Error("Election form not found")
    }

    const submissions: any[] = await prisma.submission.findMany({
      where: { questionnaireId },
      include: {
        pollingStation: true,
        answers: {
          include: { question: true },
        },
        user: {
          select: { firstname: true, othernames: true, email: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    const totalStations = await prisma.pollingStation.count({
      where: { deletedAt: null },
    })

    const stationsReported = new Set(
      submissions
        .filter((s: any) => s.pollingStationId)
        .map((s: any) => s.pollingStationId)
    ).size

    const allQuestions: any[] = questionnaire.sections.flatMap(
      (section: any) => section.units.flatMap((unit: any) => unit.questions)
    )

    const results: ResultSummary[] = allQuestions
      .filter((q: any) => {
        const details = q.details as any
        return details?.type === "number"
      })
      .map((question: any) => {
        const questionAnswers: { value: number; station: any }[] =
          submissions.flatMap((sub: any) =>
            sub.answers
              .filter((a: any) => a.questionId === question.id)
              .map((a: any) => ({
                value: parseFloat(a.answer) || 0,
                station: sub.pollingStation,
              }))
          )

        const totalValue = questionAnswers.reduce(
          (sum: number, a: { value: number }) => sum + a.value,
          0
        )

        const byStationMap = new Map<
          string,
          {
            stationId: string
            stationName: string
            stationCode: string
            county: string
            constituency: string
            ward: string
            value: number
          }
        >()

        questionAnswers.forEach(
          (qa: { value: number; station: any }) => {
            if (qa.station) {
              const existing = byStationMap.get(qa.station.id)
              if (existing) {
                existing.value += qa.value
              } else {
                byStationMap.set(qa.station.id, {
                  stationId: qa.station.id,
                  stationName: qa.station.name,
                  stationCode: qa.station.code,
                  county: qa.station.county,
                  constituency: qa.station.constituency,
                  ward: qa.station.ward,
                  value: qa.value,
                })
              }
            }
          }
        )

        return {
          questionId: question.id,
          questionTitle: question.title as any[],
          totalValue,
          submissions: questionAnswers.length,
          byStation: Array.from(byStationMap.values()),
        }
      })

    const submissionsByStatus = [
      {
        status: "PENDING",
        count: submissions.filter((s: any) => s.status === "PENDING").length,
      },
      {
        status: "VERIFIED",
        count: submissions.filter((s: any) => s.status === "VERIFIED").length,
      },
      {
        status: "DISPUTED",
        count: submissions.filter((s: any) => s.status === "DISPUTED").length,
      },
      {
        status: "REJECTED",
        count: submissions.filter((s: any) => s.status === "REJECTED").length,
      },
    ]

    const recentSubmissions = submissions.slice(0, 10).map((s: any) => ({
      id: s.id,
      stationName: s.pollingStation?.name ?? "Unknown",
      stationCode: s.pollingStation?.code ?? "N/A",
      submittedBy: `${s.user.firstname} ${s.user.othernames}`,
      submittedAt: s.submittedAt.toISOString(),
      status: s.status,
      answerCount: s.answers.length,
    }))

    return {
      questionnaireId: questionnaire.id,
      questionnaireTitle: questionnaire.title as any[],
      totalSubmissions: submissions.length,
      totalStations,
      stationsReported,
      results,
      submissionsByStatus,
      recentSubmissions,
    }
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting election results:", message)
    throw new Error(message)
  }
}

export const getResultsByConstituency = async (questionnaireId: string) => {
  try {
    const submissions: any[] = await prisma.submission.findMany({
      where: { questionnaireId },
      include: {
        pollingStation: true,
        answers: {
          include: { question: true },
        },
      },
    })

    const byConstituency = new Map<string, Map<string, number>>()

    submissions.forEach((sub: any) => {
      if (!sub.pollingStation) return
      const constituency = sub.pollingStation.constituency

      if (!byConstituency.has(constituency)) {
        byConstituency.set(constituency, new Map())
      }

      const constituencyMap = byConstituency.get(constituency)!

      sub.answers.forEach((answer: any) => {
        const details = answer.question.details as any
        if (details?.type === "number") {
          const questionTitle = JSON.stringify(answer.question.title)
          const current = constituencyMap.get(questionTitle) || 0
          constituencyMap.set(
            questionTitle,
            current + (parseFloat(answer.answer) || 0)
          )
        }
      })
    })

    return Array.from(byConstituency.entries()).map(
      ([constituency, results]) => ({
        constituency,
        results: Array.from(results.entries()).map(([question, total]) => ({
          question: JSON.parse(question),
          total,
        })),
      })
    )
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting results by constituency:", message)
    throw new Error(message)
  }
}

export const getSubmissions = async (questionnaireId: string) => {
  try {
    return await prisma.submission.findMany({
      where: { questionnaireId },
      include: {
        pollingStation: true,
        answers: { include: { question: true } },
        user: {
          select: { firstname: true, othernames: true, email: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    })
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting submissions:", message)
    throw new Error(message)
  }
}

export const updateSubmissionStatus = async (
  id: string,
  status: "PENDING" | "VERIFIED" | "DISPUTED" | "REJECTED"
) => {
  try {
    return await prisma.submission.update({
      where: { id },
      data: { status },
    })
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error updating submission status:", message)
    throw new Error(message)
  }
}
