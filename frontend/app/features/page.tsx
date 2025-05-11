"use client";

import React from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/features/page-layout";
import { PageHeader } from "@/components/documentation/page-header";
import { FeatureCard } from "@/components/features/feature-card";
import { HelpCard } from "@/components/documentation/help-card";
import { Search, MessageSquare, Zap, BookOpen, Lock, BarChart } from "lucide-react";

// Features data
const featuresData = [
  {
    title: "Intelligent Document Search",
    description: "Quickly find exactly what you need in large documents with our AI-powered semantic search engine.",
    icon: <Search className="w-8 h-8 text-primary" />
  },
  {
    title: "Natural Conversations",
    description: "Have natural conversations about your documents in plain language, no complex queries needed.",
    icon: <MessageSquare className="w-8 h-8 text-primary" />
  },
  {
    title: "Multi-Document Analysis",
    description: "Connect information across multiple documents to gain comprehensive insights effortlessly.",
    icon: <BookOpen className="w-8 h-8 text-primary" />
  },
  {
    title: "Advanced Security",
    description: "Your documents remain private and secure with enterprise-grade encryption and access controls.",
    icon: <Lock className="w-8 h-8 text-primary" />
  },
  {
    title: "Real-time Processing",
    description: "Get immediate insights with our high-speed document processing and analysis engine.",
    icon: <Zap className="w-8 h-8 text-primary" />
  },
  {
    title: "Actionable Analytics",
    description: "Track usage patterns and gain insights about how your team interacts with documents.",
    icon: <BarChart className="w-8 h-8 text-primary" />
  }
];

export default function FeaturesPage() {
  return (
    <PageLayout>
      <div className="pt-24 pb-16">
        <div className="container px-4 mx-auto">
          <PageHeader 
            title="Key Features" 
            description="Discover the powerful capabilities of Pagey AI"
            mascotMood="excited"
          />

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {featuresData.map((feature, index) => (
              <FeatureCard 
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
              />
            ))}
          </motion.div>
          
          <HelpCard 
            title="Ready to Experience Pagey AI?"
            description="Start your journey with Pagey AI today and transform how you interact with your documents."
            buttonText="Try for Free"
            buttonLink="/sign-up"
            className="mt-16"
          />
        </div>
      </div>
    </PageLayout>
  );
} 