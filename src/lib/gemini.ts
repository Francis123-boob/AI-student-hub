import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAssignmentPlan(assignmentDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Break this assignment into steps with estimated time: ${assignmentDescription}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["task", "time"]
            }
          }
        },
        required: ["steps"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function simplifyNotes(notes: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize and simplify these notes: ${notes}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["summary", "explanation"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateMockExam(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a mock exam based on this content: ${content}. Include 5 MCQs and 2 short answer questions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mcqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer"]
            }
          },
          shortAnswers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                sampleAnswer: { type: Type.STRING }
              },
              required: ["question", "sampleAnswer"]
            }
          }
        },
        required: ["mcqs", "shortAnswers"]
      }
    }
  });
  return JSON.parse(response.text);
}
