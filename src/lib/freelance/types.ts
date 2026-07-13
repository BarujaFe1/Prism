export type FreelanceProjectType = "fixed" | "hourly" | "retainer";
export type FreelanceEngagementType = "part-time" | "full-time" | "occasional";
export type FreelanceExperienceLevel = "entry" | "intermediate" | "expert";
export type FreelanceProjectStatus = "new" | "saved" | "priority" | "proposed" | "interviewing" | "contracted" | "rejected" | "ignored";
export type FreelancePlatform = "upwork" | "contra" | "malt" | "weworkremotely" | "freelancer" | "peopleperhour" | "remoteok" | "simplyhired";
export type FreelanceGrade = "S" | "A" | "B" | "C" | "D";

export interface FreelanceProjectData {
  externalId?: string;
  sourceId: string;
  title: string;
  clientName?: string;
  clientUrl?: string;
  clientCountry?: string;
  clientRating?: number;
  clientTotalSpent?: number;
  clientHireRate?: number;
  clientTotalHires?: number;
  description?: string;
  url: string;
  platform: FreelancePlatform;
  projectType?: FreelanceProjectType;
  duration?: string;
  engagementType?: FreelanceEngagementType;
  experienceLevel?: FreelanceExperienceLevel;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency?: string;
  budgetType?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  skills?: string[];
  category?: string;
  subcategory?: string;
  proposalsCount?: number;
  proposalsBracket?: string;
  interviewsCount?: number;
  postedAt?: string;
  expiresAt?: string;
  contentHash?: string;
}

export interface FreelanceScoreResult {
  total: number;
  grade: FreelanceGrade;
  breakdown: {
    skillFit: number;
    clientQuality: number;
    financialFit: number;
    competition: number;
    projectClarity: number;
  };
  redFlags: FreelanceFlag[];
  greenFlags: FreelanceFlag[];
  recommendation: "apply_now" | "apply_soon" | "consider" | "skip";
  estimatedWinProbability: number;
}

export interface FreelanceFlag {
  type: "red" | "green";
  level?: "low" | "medium" | "high";
  label: string;
  message: string;
}

export interface FreelanceProfile {
  minHourlyRate: number;
  preferredCurrency: string;
  availableHoursPerWeek: number;
  openToFixedPrice: boolean;
  minFixedProjectValue: number;
  experienceYears: number;
  portfolioUrl: string;
  specialization: string;
  skills: string[];
}
