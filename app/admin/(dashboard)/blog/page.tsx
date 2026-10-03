import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SimpleRecordForm } from "@/components/admin/simple-admin-forms";
import { RecordDeleteButton } from "@/components/admin/record-delete-button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AdminPageHeader title="Blog" description="Posts counted on the dashboard and used for company updates." />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <SimpleRecordForm
          endpoint="/api/admin/blog"
          submitLabel="Add post"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "body", label: "Body", required: true },
          ]}
        />
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-medium text-navy">{post.title}</td>
                  <td className="px-4 py-3">{post.published ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <RecordDeleteButton href={`/api/admin/blog/${post.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
