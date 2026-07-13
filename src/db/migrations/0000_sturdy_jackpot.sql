CREATE TABLE `connector_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`connector_name` text NOT NULL,
	`run_at` text NOT NULL,
	`jobs_fetched` integer DEFAULT 0,
	`jobs_new` integer DEFAULT 0,
	`jobs_duplicate` integer DEFAULT 0,
	`error_message` text,
	`duration_ms` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_events` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`event_type` text NOT NULL,
	`description` text,
	`metadata` text,
	`occurred_at` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `job_followups` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`title` text NOT NULL,
	`note` text,
	`due_at` text NOT NULL,
	`done` integer DEFAULT false,
	`done_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`description` text,
	`description_clean` text,
	`hash` text,
	`location` text,
	`location_type` text,
	`salary_min` integer,
	`salary_max` integer,
	`currency` text,
	`salary_period` text,
	`contract_type` text,
	`experience_level` text,
	`technologies` text,
	`tags` text,
	`source` text NOT NULL,
	`source_id` text,
	`url` text,
	`company_url` text,
	`company_logo_url` text,
	`posted_at` text,
	`fetched_at` text DEFAULT (current_timestamp) NOT NULL,
	`is_normalized` integer DEFAULT false,
	`is_international` integer DEFAULT false,
	`city` text,
	`country` text,
	`country_code` text,
	`detected_language` text DEFAULT 'pt',
	`translated_description` text,
	`score` real,
	`score_details` text,
	`summary` text,
	`gaps` text,
	`key_requirements` text,
	`fit_label` text,
	`cover_suggestion` text,
	`raw_data` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`name` text,
	`headline` text,
	`summary` text,
	`skills` text,
	`desired_roles` text,
	`desired_salary_min` integer,
	`desired_salary_max` integer,
	`desired_currency` text DEFAULT 'BRL',
	`desired_location_types` text,
	`desired_contract_types` text,
	`experience_level` text,
	`languages` text,
	`negative_keywords` text,
	`github_url` text,
	`linkedin_url` text,
	`portfolio_url` text,
	`resume_url` text,
	`resume_filename` text,
	`contact_email` text,
	`freelance_min_hourly_rate` real,
	`freelance_preferred_currency` text DEFAULT 'USD',
	`freelance_available_hours_per_week` integer,
	`freelance_open_to_fixed_price` integer DEFAULT true,
	`freelance_min_fixed_project_value` real,
	`freelance_experience_years` integer,
	`freelance_portfolio_url` text,
	`freelance_specialization` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`filters` text NOT NULL,
	`notify_in_app` integer DEFAULT true,
	`last_run_at` text,
	`last_new_count` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`enabled` integer DEFAULT true,
	`config` text,
	`last_sync_at` text,
	`last_error` text,
	`last_job_count` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `target_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`careers_url` text,
	`ats_type` text,
	`keywords` text,
	`last_crawled_at` text,
	`last_error` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `freelance_client_watchlist` (
	`id` text PRIMARY KEY NOT NULL,
	`client_name` text NOT NULL,
	`platform` text NOT NULL,
	`client_url` text,
	`reason` text,
	`alert_on_new_project` integer DEFAULT true,
	`created_at` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE TABLE `freelance_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text,
	`source_id` text NOT NULL,
	`title` text NOT NULL,
	`client_name` text,
	`client_url` text,
	`client_country` text,
	`client_rating` real,
	`client_total_spent` real,
	`client_hire_rate` real,
	`client_total_hires` integer,
	`description` text,
	`url` text NOT NULL,
	`platform` text NOT NULL,
	`project_type` text,
	`duration` text,
	`engagement_type` text,
	`experience_level` text,
	`budget_min` real,
	`budget_max` real,
	`budget_currency` text DEFAULT 'USD',
	`budget_type` text,
	`hourly_rate_min` real,
	`hourly_rate_max` real,
	`skills` text,
	`category` text,
	`subcategory` text,
	`proposals_count` integer,
	`proposals_bracket` text,
	`interviews_count` integer,
	`fit_score` real,
	`fit_breakdown` text,
	`red_flags` text,
	`opportunities` text,
	`status` text DEFAULT 'new',
	`posted_at` text,
	`expires_at` text,
	`collected_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp),
	`content_hash` text
);
--> statement-breakpoint
CREATE TABLE `freelance_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`cover_letter` text,
	`proposed_rate` real,
	`proposed_rate_type` text,
	`proposed_duration` text,
	`attachments` text,
	`outcome` text,
	`client_feedback` text,
	`final_rate` real,
	`contract_value` real,
	`proposed_at` text,
	`responded_at` text,
	`contracted_at` text,
	`notes` text,
	FOREIGN KEY (`project_id`) REFERENCES `freelance_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `freelance_rate_history` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`skill` text,
	`platform` text,
	`p25_rate` real,
	`p50_rate` real,
	`p75_rate` real,
	`sample_size` integer,
	`recorded_at` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE TABLE `freelance_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`platform` text NOT NULL,
	`config` text,
	`enabled` integer DEFAULT true,
	`last_sync_at` text,
	`total_collected` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`error_message` text,
	`avg_projects_per_sync` real
);
