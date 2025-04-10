import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import NewsArticleForm from "@/app/components/NewsArticleForm";

export const metadata: Metadata = {
  title: "Add New Article | The Walking Golfer Admin",
  description: "Create a new article for The Walking Golfer",
};

export default function NewArticlePage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/admin/news"
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Articles
      </Link>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Article
        </h1>
        <NewsArticleForm />
      </div>
    </div>
  );
}
