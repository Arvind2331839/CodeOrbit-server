import mongoose, { Schema, type Model, type Document } from "mongoose";

export type QuestionDifficulty = "beginner" | "intermediate" | "advanced";

export interface IQuestionOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  id: string;
  title?: string;
  question: string;
  answer: string;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  codeExample?: string;
  output?: string;
  explanation?: string;
  options: IQuestionOption[];
  correctAnswer?: string;
  technology: string;
  createdAt: Date;
  updatedAt: Date;
}

type QuestionModel = Model<IQuestion>;

const questionOptionSchema = new Schema<IQuestionOption>(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion, QuestionModel>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subtopic: {
      type: String,
      trim: true,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    codeExample: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      default: "",
    },
    options: {
      type: [questionOptionSchema],
      default: [],
    },
    correctAnswer: {
      type: String,
      trim: true,
      default: "",
    },
    technology: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ technology: 1, topic: 1, difficulty: 1 });
questionSchema.index({ question: "text", title: "text", explanation: "text" });

const Question = mongoose.model<IQuestion, QuestionModel>("Question", questionSchema);

export default Question;
