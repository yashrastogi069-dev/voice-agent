CREATE TABLE `callRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int NOT NULL,
	`contactId` int NOT NULL,
	`outcome` enum('interested','callback','not_interested','dnc') NOT NULL,
	`transcript` text NOT NULL,
	`summary` text NOT NULL,
	`priority` boolean NOT NULL DEFAULT false,
	`isSynthetic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `callRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `callbackRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int NOT NULL,
	`contactId` int NOT NULL,
	`note` text NOT NULL,
	`status` enum('queued','completed') NOT NULL DEFAULT 'queued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `callbackRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`status` enum('draft','approved','paused') NOT NULL DEFAULT 'draft',
	`approvedScript` text NOT NULL,
	`knowledgeBase` text NOT NULL,
	`callingStartHour` int NOT NULL DEFAULT 9,
	`callingEndHour` int NOT NULL DEFAULT 21,
	`frequencyCap` int NOT NULL DEFAULT 2,
	`approvedAt` timestamp,
	`isSynthetic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policyAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflow` enum('outbound','inbound','delegated') NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`allowed` boolean NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policyAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`phoneNumber` varchar(32) NOT NULL,
	`language` enum('English','Hindi') NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
	`consentStatus` enum('opt_in','unknown','opted_out') NOT NULL DEFAULT 'unknown',
	`consentSource` varchar(180),
	`consentScope` varchar(180),
	`consentAt` timestamp,
	`dnc` boolean NOT NULL DEFAULT false,
	`isSynthetic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflow` enum('outbound','inbound','delegated') NOT NULL,
	`policyJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflowPolicies_id` PRIMARY KEY(`id`)
);
