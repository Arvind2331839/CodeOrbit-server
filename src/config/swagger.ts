import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "DevPrep Platform API",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for DevPrep interview platform. Provides public question discovery for students and role-protected question management for administrators.",
  },
  servers: [
    {
      url: "/api",
      description: "Current API base",
    },
    {
      url: "http://localhost:5000/api",
      description: "Local development environment",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT Bearer token obtained from /auth/login or /auth/register",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "refreshToken",
        description: "HttpOnly rotating refresh session cookie scoped to /api/auth",
      },
    },
    schemas: {
      QuestionOption: {
        type: "object",
        required: ["id", "text"],
        properties: {
          id: { type: "string", example: "A", description: "Option letter (A, B, C, D)" },
          text: { type: "string", example: "The effect runs only once after initial render." },
        },
      },
      Question: {
        type: "object",
        required: ["id", "question", "answer", "topic", "difficulty", "technology"],
        properties: {
          id: { type: "string", example: "react-hooks-0001", description: "Unique slug identifier" },
          title: { type: "string", example: "useEffect Dependency Array Behavior" },
          question: { type: "string", example: "What happens when an empty dependency array is passed to useEffect?" },
          answer: { type: "string", example: "Option B: The effect runs only once after initial render." },
          topic: { type: "string", example: "Hooks" },
          subtopic: { type: "string", example: "useEffect Lifecycle" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], example: "beginner" },
          tags: { type: "array", items: { type: "string" }, example: ["react", "hooks", "lifecycle"] },
          codeExample: { type: "string", example: "useEffect(() => {}, []);" },
          output: { type: "string", example: "" },
          explanation: { type: "string", example: "An empty dependency array instructs React to execute the effect only once." },
          options: { type: "array", items: { $ref: "#/components/schemas/QuestionOption" } },
          correctAnswer: { type: "string", example: "B" },
          technology: { type: "string", example: "react", enum: ["javascript", "react", "nodejs", "database", "typescript"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateQuestionInput: {
        type: "object",
        required: ["question", "answer", "topic", "difficulty", "technology"],
        properties: {
          id: { type: "string", description: "Optional custom identifier. Auto-generated if omitted." },
          title: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" },
          topic: { type: "string" },
          subtopic: { type: "string" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          tags: { type: "array", items: { type: "string" } },
          codeExample: { type: "string" },
          output: { type: "string" },
          explanation: { type: "string" },
          options: { type: "array", items: { $ref: "#/components/schemas/QuestionOption" } },
          correctAnswer: { type: "string", example: "A" },
          technology: { type: "string", example: "javascript" },
        },
      },
      QuestionStatistics: {
        type: "object",
        properties: {
          totalQuestions: { type: "integer", example: 168 },
          topicCounts: { type: "object", additionalProperties: { type: "integer" } },
          difficultyCounts: {
            type: "object",
            properties: {
              beginner: { type: "integer" },
              intermediate: { type: "integer" },
              advanced: { type: "integer" },
            },
          },
          beginnerCount: { type: "integer", example: 45 },
          intermediateCount: { type: "integer", example: 88 },
          advancedCount: { type: "integer", example: 35 },
          totalTopics: { type: "integer", example: 24 },
        },
      },
      PaginatedQuestionsResult: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/Question" } },
          total: { type: "integer", example: 193 },
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 10 },
          startIndex: { type: "integer", example: 1 },
          endIndex: { type: "integer", example: 20 },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@devprep.com" },
          password: { type: "string", format: "password", example: "AdminPassword123!" },
        },
      },
      UserDTO: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          profilePic: { type: "string" },
          emailVerified: { type: "boolean" },
        },
      },
      StandardSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid request data" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  paths: {
    "/questions": {
      get: {
        tags: ["Questions"],
        summary: "List and search questions (Public)",
        description: "Returns paginated questions with filtering by technology, topic, difficulty, and search term. No login required.",
        parameters: [
          { name: "technology", in: "query", schema: { type: "string" }, description: "Filter by subject (e.g. javascript, react)" },
          { name: "topic", in: "query", schema: { type: "string" }, description: "Filter by topic name" },
          { name: "difficulty", in: "query", schema: { type: "string", enum: ["beginner", "intermediate", "advanced", "all"] } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search keyword matching question text, title, tags, or options" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Paginated questions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PaginatedQuestionsResult" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Questions"],
        summary: "Create single question (Admin only)",
        description: "Requires JWT Bearer token of an administrator account.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateQuestionInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Question created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Question created successfully" },
                    data: { $ref: "#/components/schemas/Question" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthenticated" },
          403: { description: "Forbidden - Administrator role required" },
          409: { description: "Question with this ID already exists" },
        },
      },
    },
    "/questions/stats": {
      get: {
        tags: ["Questions"],
        summary: "Get aggregated question statistics (Public)",
        description: "Returns question counts grouped by topic and difficulty level.",
        parameters: [
          { name: "technology", in: "query", schema: { type: "string", default: "javascript" } },
        ],
        responses: {
          200: {
            description: "Statistics computed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/QuestionStatistics" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/questions/topics": {
      get: {
        tags: ["Questions"],
        summary: "Get distinct topics with question counts (Public)",
        parameters: [
          { name: "technology", in: "query", schema: { type: "string", default: "javascript" } },
        ],
        responses: {
          200: {
            description: "Topic list retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        technology: { type: "string" },
                        totalQuestions: { type: "integer" },
                        topics: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              count: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/questions/{id}": {
      get: {
        tags: ["Questions"],
        summary: "Get single question by ID (Public)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Custom question slug (e.g. react-hooks-0001) or MongoDB _id" },
        ],
        responses: {
          200: {
            description: "Question details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Question" },
                  },
                },
              },
            },
          },
          404: { description: "Question not found" },
        },
      },
      put: {
        tags: ["Questions"],
        summary: "Update existing question (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "Question updated successfully" },
          401: { description: "Unauthenticated" },
          403: { description: "Forbidden" },
          404: { description: "Question not found" },
        },
      },
      delete: {
        tags: ["Questions"],
        summary: "Delete question (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Question deleted successfully" },
          401: { description: "Unauthenticated" },
          403: { description: "Forbidden" },
          404: { description: "Question not found" },
        },
      },
    },
    "/questions/bulk": {
      post: {
        tags: ["Questions"],
        summary: "Bulk insert or upsert questions (Admin only)",
        description: "Submit an array of question objects. Performs an atomic bulk upsert by question id.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/CreateQuestionInput" },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Bulk import processed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Successfully processed 15 questions" },
                    data: {
                      type: "object",
                      properties: {
                        totalReceived: { type: "integer" },
                        upsertedCount: { type: "integer" },
                        modifiedCount: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Validation error or invalid JSON structure" },
          401: { description: "Unauthenticated" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate user or administrator",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful; sets HttpOnly refreshToken cookie and returns accessToken",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/UserDTO" },
                        accessToken: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid email or password" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user and revoke refresh session",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Logout successful and cookies invalidated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current authenticated profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserDTO" },
                  },
                },
              },
            },
          },
          401: { description: "Authentication required" },
        },
      },
    },
    "/users/all": {
      get: {
        tags: ["Users"],
        summary: "List all users (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User list" },
          401: { description: "Unauthenticated" },
          403: { description: "Forbidden" },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "DevPrep API Documentation",
    })
  );

  // Expose JSON specification
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
