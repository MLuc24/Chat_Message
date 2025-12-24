-- CreateTable
CREATE TABLE "nicknames" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nicknames_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nicknames_conversation_id_idx" ON "nicknames"("conversation_id");

-- CreateIndex
CREATE INDEX "nicknames_user_id_idx" ON "nicknames"("user_id");

-- CreateIndex
CREATE INDEX "nicknames_target_user_id_idx" ON "nicknames"("target_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "nicknames_conversation_id_user_id_target_user_id_key" ON "nicknames"("conversation_id", "user_id", "target_user_id");
