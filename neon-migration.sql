-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "morningIntention" TEXT,
    "dailyInsight" TEXT,
    "suggestedAction" TEXT,
    "eveningReflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "moodRating" INTEGER NOT NULL,
    "activities" TEXT[],
    "sentiment" DOUBLE PRECISION,
    "sentimentLabel" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dayLogId" TEXT,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moodScore" INTEGER NOT NULL,
    "note" TEXT,
    "triggers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dayLogId" TEXT,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dayLogId" TEXT,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_checkins" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "note" TEXT,
    "completed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" JSONB NOT NULL,
    "insights" TEXT NOT NULL,
    "suggestions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_trackings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "helpfulnessScore" INTEGER,
    "userNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "lifeStage" TEXT NOT NULL,
    "communicationStyle" TEXT NOT NULL,
    "preferredTone" TEXT NOT NULL,
    "hobbies" TEXT[],
    "interests" JSONB,
    "currentWellbeing" INTEGER NOT NULL,
    "primaryGoals" TEXT[],
    "aiPersona" TEXT NOT NULL,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" TIMESTAMP(3),
    "tutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tutorialCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moodScore" INTEGER NOT NULL,
    "context" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "activityType" TEXT,
    "relatedTo" TEXT,
    "improvement" INTEGER,

    CONSTRAINT "mood_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_exercises" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originalThought" TEXT,
    "reframedThought" TEXT,
    "conversation" JSONB,
    "activity" TEXT,
    "moodBefore" INTEGER,
    "moodAfter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapy_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reflections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "bestMoment" TEXT,
    "hardestMoment" TEXT,
    "howHandled" TEXT,
    "adviceForNextWeek" TEXT,
    "avgMood" DOUBLE PRECISION,
    "daysJournaled" INTEGER NOT NULL DEFAULT 0,
    "bestDay" TEXT,
    "toughestDay" TEXT,
    "moodTrend" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "day_logs_userId_idx" ON "day_logs"("userId");

-- CreateIndex
CREATE INDEX "day_logs_date_idx" ON "day_logs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "day_logs_userId_date_key" ON "day_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "journal_entries_userId_idx" ON "journal_entries"("userId");

-- CreateIndex
CREATE INDEX "journal_entries_createdAt_idx" ON "journal_entries"("createdAt");

-- CreateIndex
CREATE INDEX "journal_entries_dayLogId_idx" ON "journal_entries"("dayLogId");

-- CreateIndex
CREATE INDEX "mood_entries_userId_idx" ON "mood_entries"("userId");

-- CreateIndex
CREATE INDEX "mood_entries_createdAt_idx" ON "mood_entries"("createdAt");

-- CreateIndex
CREATE INDEX "mood_entries_dayLogId_idx" ON "mood_entries"("dayLogId");

-- CreateIndex
CREATE INDEX "goals_userId_idx" ON "goals"("userId");

-- CreateIndex
CREATE INDEX "goals_dayLogId_idx" ON "goals"("dayLogId");

-- CreateIndex
CREATE INDEX "goal_checkins_goalId_idx" ON "goal_checkins"("goalId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_createdAt_idx" ON "chat_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "patterns_userId_idx" ON "patterns"("userId");

-- CreateIndex
CREATE INDEX "patterns_isActive_idx" ON "patterns"("isActive");

-- CreateIndex
CREATE INDEX "patterns_createdAt_idx" ON "patterns"("createdAt");

-- CreateIndex
CREATE INDEX "action_trackings_userId_idx" ON "action_trackings"("userId");

-- CreateIndex
CREATE INDEX "action_trackings_dayLogId_idx" ON "action_trackings"("dayLogId");

-- CreateIndex
CREATE INDEX "action_trackings_accepted_idx" ON "action_trackings"("accepted");

-- CreateIndex
CREATE INDEX "action_trackings_completed_idx" ON "action_trackings"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "mood_snapshots_userId_idx" ON "mood_snapshots"("userId");

-- CreateIndex
CREATE INDEX "mood_snapshots_type_idx" ON "mood_snapshots"("type");

-- CreateIndex
CREATE INDEX "therapy_exercises_userId_idx" ON "therapy_exercises"("userId");

-- CreateIndex
CREATE INDEX "therapy_exercises_type_idx" ON "therapy_exercises"("type");

-- CreateIndex
CREATE INDEX "weekly_reflections_userId_idx" ON "weekly_reflections"("userId");

-- CreateIndex
CREATE INDEX "weekly_reflections_weekOf_idx" ON "weekly_reflections"("weekOf");

-- AddForeignKey
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "day_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "day_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "day_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_checkins" ADD CONSTRAINT "goal_checkins_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_trackings" ADD CONSTRAINT "action_trackings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_trackings" ADD CONSTRAINT "action_trackings_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "day_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_snapshots" ADD CONSTRAINT "mood_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_exercises" ADD CONSTRAINT "therapy_exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reflections" ADD CONSTRAINT "weekly_reflections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

