-- Career OS foundation: tracks + evidence vault
CREATE TABLE IF NOT EXISTS `career_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`role_titles` text DEFAULT '[]',
	`core_skills` text DEFAULT '[]',
	`secondary_skills` text DEFAULT '[]',
	`headline` text,
	`resume_url` text,
	`markets` text DEFAULT '[]',
	`contracts` text DEFAULT '[]',
	`negative_keywords` text DEFAULT '[]',
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `career_tracks_key_unique` ON `career_tracks` (`key`);

CREATE TABLE IF NOT EXISTS `project_evidences` (
	`id` text PRIMARY KEY NOT NULL,
	`project_name` text NOT NULL,
	`project_url` text,
	`demo_url` text,
	`description` text,
	`metrics` text,
	`metric_kind` text DEFAULT 'unknown',
	`approved_resume_bullet` text,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`associated_skills` text DEFAULT '[]',
	`source_type` text DEFAULT 'user_declared',
	`source_url` text,
	`verified_by_user` integer DEFAULT false,
	`last_reviewed_at` text,
	`evidence_level` integer DEFAULT 2,
	`claims_allowed` text DEFAULT '[]',
	`claims_forbidden` text DEFAULT '[]',
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
