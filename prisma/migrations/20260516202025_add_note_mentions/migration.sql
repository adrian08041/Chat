-- AlterTable
ALTER TABLE "ConversationNote" ADD COLUMN     "mentionedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
