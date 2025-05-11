"use client";

import React, { useState } from "react";
import { PageLayout } from "@/components/features/page-layout";
import { PageHeader } from "@/components/documentation/page-header";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { CategoryFilter } from "@/components/blog/category-filter";
import { NewsletterCard } from "@/components/blog/newsletter-card";

// Sample blog data
const blogPosts = [
  {
    id: 1,
    title: "How AI is Transforming Document Analysis",
    excerpt: "Discover how artificial intelligence is revolutionizing the way professionals interact with documents and extract insights.",
    author: "Alex Morgan",
    date: "May 14, 2023",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "5 Ways to Improve Your Research Workflow with Pagey AI",
    excerpt: "Learn how to streamline your research process and save hours of work using Pagey AI's advanced document analysis features.",
    author: "James Chen",
    date: "April 28, 2023",
    category: "Productivity",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
    readTime: "4 min read"
  },
  {
    id: 3,
    title: "The Future of Legal Document Processing",
    excerpt: "How AI-powered tools like Pagey AI are changing the landscape of legal document review and analysis.",
    author: "Sarah Williams",
    date: "March 15, 2023",
    category: "Legal",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "Understanding PDF Structure: A Deep Dive",
    excerpt: "Explore the technical aspects of PDF documents and how Pagey AI interprets them to provide intelligent responses.",
    author: "Michael Rodriguez",
    date: "February 22, 2023",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=800",
    readTime: "8 min read"
  },
];

// Categories for filtering
const categories = ["All", "Technology", "Productivity", "Legal", "Technical"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  
  const filteredPosts = activeCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);
  
  return (
    <PageLayout>
      <div className="pt-24 pb-16">
        <div className="container px-4 mx-auto">
          <PageHeader 
            title="Pagey AI Blog" 
            description="Insights, tutorials, and updates about document AI technology"
            showMascot={false} 
          />
          
          <CategoryFilter 
            categories={categories} 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {filteredPosts.map((post, index) => (
              <BlogPostCard
                key={post.id}
                {...post}
                delayIndex={index}
              />
            ))}
          </div>
          
          <NewsletterCard />
        </div>
      </div>
    </PageLayout>
  );
} 