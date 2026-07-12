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
    case "CONTENT_ROLE_RECIPE_MISSING":
      return "No learning recipe for that goal yet";
    case "CATALOG_EMPTY":
      return "Skill catalog is empty for this path";
    case "CONTENT_VERSION_NOT_PUBLISHED":
      return "That lesson isn't published yet";
    case "CONTENT_GRAPH_CYCLE":
      return "Skill prerequisites form a loop — content needs a fix";
    case "CONTENT_REQUIRED_BUDGET_EXCEEDED":
      return "That deadline is too tight for the required skills";
    case "CONTENT_LANGUAGE_UNAVAILABLE":
      return "Content isn't available in your language yet";
    case "CONTENT_RESOURCE_INACTIVE":
      return "A linked resource is unavailable";
    case "CONTENT_QUESTION_POOL_TOO_SMALL":
    case "BATTLE_INSUFFICIENT_QUESTION_POOL":
      return "Not enough reviewed questions for that battle";
    case "CONTENT_VERSION_BLOCKED":
      return "This content is temporarily blocked";
    case "CONTENT_NOT_FOUND":
      return "Content not found";
    case "CONTENT_INVALID_TRANSITION":
      return "Invalid content publish step";
    case "BATTLE_OPPONENT_NOT_ALLOWED":
      return "That opponent isn't available for battle";
    case "BATTLE_ALREADY_PENDING":
      return "You're already in an active battle";
    case "BATTLE_INVITE_EXPIRED":
      return "That battle invite expired";
    case "BATTLE_INSUFFICIENT_COINS":
      return "Not enough coins for that stake";
    case "BATTLE_STAKE_LIMIT":
      return "Stake is above your rank limit";
    case "BATTLE_ALREADY_STARTED":
      return "Battle already started";
    case "BATTLE_ANSWER_ALREADY_SUBMITTED":
      return "You already answered this question";
    case "BATTLE_QUESTION_EXPIRED":
      return "Time's up on that question";
    case "BATTLE_NOT_PARTICIPANT":
      return "You're not in this battle";
    case "BATTLE_SETTLEMENT_FAILED":
      return "Coin settlement failed — try again";
    case "BATTLE_NOT_FOUND":
      return "Battle not found";
    case "BATTLE_INVALID_STATE":
      return "Battle isn't ready for that action";
    case "BATTLE_RISK_HOLD":
      return "Battle on hold for review";
    case "BATTLE_DISCONNECT_FORFEIT":
      return "Disconnected too long — battle forfeited";
    case "REFERRAL_CODE_NOT_FOUND":
      return "Referral code not found";
    case "REFERRAL_LINK_INVALID":
    case "REFERRAL_LINK_NOT_FOUND":
    case "REFERRAL_LINK_INACTIVE":
      return "That invite link is no longer valid";
    case "REFERRAL_ALREADY_ATTRIBUTED":
      return "A referral is already attached to this account";
    case "REFERRAL_CLAIM_WINDOW_CLOSED":
      return "Too late to enter a referral code";
    case "REFERRAL_SELF_NOT_ALLOWED":
      return "You can't use your own referral code";
    case "REFERRAL_UNDER_REVIEW":
      return "Referral reward is under review";
    case "REFERRAL_QUALIFICATION_EXPIRED":
      return "Referral qualification window ended";
    case "REFERRAL_CODE_ROTATE_COOLDOWN":
      return "Wait before rotating your referral code";
    case "REFERRAL_RATE_LIMITED":
      return "Too many referral actions — try later";
    case "SOCIAL_NOT_ALLOWED":
      return "That social action isn't allowed";
    case "SOCIAL_ALREADY_FRIENDS":
    case "ALREADY_FRIENDS":
      return "You're already friends";
    case "SOCIAL_REQUEST_NOT_FOUND":
    case "FRIEND_REQUEST_NOT_FOUND":
      return "Friend request not found";
    case "FRIEND_REQUEST_NOT_RECEIVER":
      return "Only the recipient can respond";
    case "FRIEND_REQUEST_ALREADY_PENDING":
      return "Friend request already pending";
    case "SOCIAL_BLOCKED":
      return "You can't interact with this user";
    case "SOCIAL_USER_NOT_FOUND":
      return "User not found";
    case "SOCIAL_SELF_ACTION_NOT_ALLOWED":
      return "You can't do that to yourself";
    case "NOT_FRIENDS":
      return "You're not friends";
    case "FOLLOW_NOT_ALLOWED":
      return "This user isn't accepting follows";
    case "PROFILE_PRIVATE":
      return "This profile is private";
    case "SOCIAL_RATE_LIMITED":
      return "Too many social actions — try later";
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
    case "LEAGUE_NOT_ASSIGNED":
      return "You're not in a league yet";
    case "LEAGUE_SEASON_NOT_ACTIVE":
      return "This league season isn't active";
    case "LEAGUE_FINALIZING":
      return "League week is wrapping up — check back soon";
    case "LEAGUE_RESULT_NOT_READY":
      return "League results aren't ready yet";
    case "LEAGUE_PROMOTION_GATE_MISSING":
      return "You need a higher rank before that league tier";
    case "STUDY_INVITE_NOT_ALLOWED":
      return "You can only study with friends";
    case "STUDY_INVITE_EXPIRED":
      return "That study invite expired";
    case "STUDY_SESSION_CONFLICT":
      return "Already in another study session";
    case "STUDY_SESSION_ALREADY_STARTED":
      return "Study session already started";
    case "STUDY_SESSION_NOT_PARTICIPANT":
      return "You're not in this study room";
    case "STUDY_SESSION_NOT_FOUND":
      return "Study session not found";
    case "STUDY_DURATION_INVALID":
      return "Pick 15, 25, 45, or 60 minutes";
    case "STUDY_TASK_NOT_AVAILABLE":
      return "That study task isn't available";
    case "STUDY_COMPLETION_NOT_QUALIFIED":
      return "Not enough verified focus time yet";
    case "STUDY_REWARD_CAP_REACHED":
      return "Study bonus cap reached for now";
    case "STUDY_INVALID_STATE":
      return "Study room isn't ready for that";
    default:
      return fallback || "Something went wrong";
  }
}
