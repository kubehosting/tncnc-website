import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { MessageList } from "@/components/admin/simple-admin-forms";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await prisma.enquiryMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Website enquiries from quote, contact, sell, and spare-part forms."
      />
      <MessageList
        initial={messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
