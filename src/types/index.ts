export type LocationType = "remote" | "hybrid" | "onsite";
export type ContractType = "clt" | "pj" | "internship" | "freelancer" | "temporary" | "international";
export type ExperienceLevel = "internship" | "trainee" | "junior" | "mid" | "senior" | "lead";
export type SalaryPeriod = "yearly" | "monthly" | "weekly" | "hourly" | "contract";
export type JobStatus = "new" | "saved" | "high_priority" | "preparing" | "applied" | "reviewing" | "interview" | "offer" | "rejected" | "ignored" | "archived";
export type FitLabel = "high" | "good" | "partial" | "low";
export type SourceType = "linkedin" | "indeed" | "remoteok" | "google_jobs" | "gupy" | "workana" | "glassdoor" | "weworkremotely" | "wellfound" | "greenhouse" | "lever" | "remotive" | "hackernews" | "arbeitnow" | "jobicy" | "linkedin_rss" | "remote-co" | "4dayweek" | "nodesk" | "revelo" | "himalayas" | "stackoverflow" | "manual" | "csv" | "ashby" | "jobposting" | "custom" | "other";

export interface ScoreDetails {
  title: number;
  skills: number;
  experience: number;
  location: number;
  salary: number;
  contract: number;
  total: number;
}

export interface RawJobData {
  title: string;
  company: string;
  description?: string;
  location?: string;
  locationType?: LocationType;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryPeriod?: SalaryPeriod;
  contractType?: ContractType;
  experienceLevel?: ExperienceLevel;
  technologies?: string[];
  tags?: string[];
  source: SourceType;
  sourceId?: string;
  url?: string;
  companyUrl?: string;
  companyLogoUrl?: string;
  postedAt?: string;
  isInternational?: boolean;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
  detectedLanguage?: string | null;
}

export interface FilterState {
  search: string;
  locationTypes: LocationType[];
  contractTypes: ContractType[];
  experienceLevels: ExperienceLevel[];
  salaryMin: number | null;
  salaryMax: number | null;
  technologies: string[];
  sources: SourceType[];
  statuses: JobStatus[];
  fitLabels: FitLabel[];
  dateRange: [Date | null, Date | null];
  sortBy: "score" | "salary" | "date" | "source" | "relevance";
  sortOrder: "asc" | "desc";
}

export interface JobWithStatus {
  id: string;
  title: string;
  company: string;
  description: string | null;
  descriptionClean: string | null;
  location: string | null;
  locationType: LocationType | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryPeriod: SalaryPeriod | null;
  contractType: ContractType | null;
  experienceLevel: ExperienceLevel | null;
  technologies: string[] | null;
  tags: string[] | null;
  source: string;
  sourceId: string | null;
  url: string | null;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  postedAt: string | null;
  fetchedAt: string;
  isInternational: boolean | null;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  detectedLanguage: string | null;
  translatedDescription: string | null;
  score: number | null;
  scoreDetails: any;
  summary: string | null;
  gaps: string[] | null;
  keyRequirements: string[] | null;
  fitLabel: FitLabel | null;
  coverSuggestion: string | null;
  status: string;
  nextActionType: string | null;
  nextActionDate: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TargetCompany {
  id: string;
  name: string;
  domain: string;
  careersUrl: string | null;
  atsType: "greenhouse" | "lever" | "ashby" | "workday" | "custom" | null;
  keywords: string[] | null;
  lastCrawledAt: string | null;
  lastError: string | null;
  isActive: boolean | null;
}

export interface AnalyticsData {
  totalJobs: number;
  bySource: Record<string, number>;
  byLocationType: Record<string, number>;
  byExperienceLevel: Record<string, number>;
  byStatus: Record<string, number>;
  byFitLabel: Record<string, number>;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
  rejectionRate: number;
  averageScore: number;
  topTechnologies: { name: string; count: number }[];
}

export interface ProfileData {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  desiredRoles: string[];
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  desiredCurrency: string;
  desiredLocationTypes: LocationType[];
  desiredContractTypes: ContractType[];
  experienceLevel: ExperienceLevel;
  languages: string[];
  negativeKeywords?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumeFilename?: string;
  contactEmail?: string;
}

export interface SettingsData {
  syncFrequency: string;
  notificationsEnabled: boolean;
  followUpDays: number;
  alertHighFitDays: number;
  dailyBriefingEnabled: boolean;
  lastBackupAt: string | null;
}

export interface ApplicationTask {
  id: string;
  jobId: string;
  type: string;
  label: string;
  isDone: boolean;
  createdAt: string;
  completedAt: string | null;
}
