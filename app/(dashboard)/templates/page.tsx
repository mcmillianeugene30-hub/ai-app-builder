"use client";

import { useState } from "react";
import Link from "next/link";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">App Templates</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Start from a proven template — fully customizable after generation
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(template => (
          <div key={template.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">{template.icon}</span>
              <div className="min-w-0">
                <h3 className="font-semibold leading-tight">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                  {template.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-1">
              <Link
                href={`/generate?prompt=${encodeURIComponent(template.prompt)}`}
                className="w-full block text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                ⚡ Generate This App
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        {TEMPLATES.length} templates · 5 credits each · all code is yours to keep and modify
      </p>
    </div>
  );
}
