CREATE TABLE `liveCallAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int NOT NULL,
	`contactId` int NOT NULL,
	`collegeProfileId` varchar(80) NOT NULL,
	`roomName` varchar(160) NOT NULL,
	`participantId` varchar(160),
	`status` enum('queued','dialing','ringing','answered','completed','failed','busy','no_answer','cancelled') NOT NULL DEFAULT 'queued',
	`providerEventId` varchar(160),
	`failureReason` text,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liveCallAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `liveCallAttempts_roomName_unique` UNIQUE(`roomName`)
);
