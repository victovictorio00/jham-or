import { notFound } from "next/navigation";
import { publicPage } from "@/lib/catalog";
import { readPublishedSnapshot } from "@/lib/published";
export const revalidate = false;
export const dynamic = "force-static";
export async function generateStaticParams(){return (await readPublishedSnapshot()).pages.map(p=>({slug:p.slug}))}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await publicPage((await params).slug);
  return { title: p?.title, description: p?.seoDescription };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await publicPage((await params).slug);
  if (!p) notFound();
  return (
    <article className="section prose">
      <p className="eyebrow">INFORMACIÓN JHAM-OR</p>
      <h1>{p.title}</h1>
      <div className="pre-line">{p.content}</div>
    </article>
  );
}
