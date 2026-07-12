import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.code = body.code;
  }
}

export function messageForCode(code: string, fallback: string): string {
  switch (code) {
    case "EMAIL_TAKEN":
      return "An account with this email already exists";
    case "INVALID_CREDENTIALS":
      return "Email or password is incorrect";
    case "PASSWORD_TOO_WEAK":
      return "Password needs 8+ characters, a number, and a special character";
    case "OTP_INVALID":
      return "That code is incorrect";
    case "OTP_EXPIRED":
      return "That code has expired — request a new one";
    case "OTP_RATE_LIMITED":
      return "Too many attempts — wait a moment";
    case "INVALID_OR_EXPIRED_TOKEN":
      return "Session expired — try again";
    case "ACCOUNT_DISABLED":
      return "This account is disabled";
    case "USERNAME_TAKEN":
      return "That username is taken";
    case "OAUTH_FAILED":
      return "Social sign-in failed";
    case "OAUTH_EMAIL_CONFLICT":
      return "This email belongs to another account";
    case "VALIDATION_ERROR":
      return fallback || "Check your input and try again";
    case "QUESTIONNAIRE_ALREADY_SUBMITTED":
      return "You already finished this questionnaire";
    case "QUESTIONNAIRE_NOT_FOUND":
      return "No questionnaire found";
    case "ROADMAP_GENERATION_FAILED":
      return "Could not start roadmap generation";
    case "GOAL_NOT_FOUND":
      return "Goal not found";
    case "ROLE_RECIPE_MISSING":
      return "No learning recipe for that goal yet";
    case "CATALOG_EMPTY":
      return "Skill catalog is empty for this path";
    case "ROADMAP_NOT_READY":
      return "Your roadmap is still generating";
    case "ROADMAP_NOT_FOUND":
      return "Roadmap not found";
    case "LESSON_NOT_FOUND":
      return "Lesson not found";
    case "LESSON_LOCKED":
      return "That lesson is still locked";
    case "LESSON_CONTENT_NOT_READY":
      return "Lesson content is still generating";
    case "LESSON_INVALID_ANSWER":
      return "That answer option is invalid";
    default:
      return fallback || "Something went wrong";
  }
}
