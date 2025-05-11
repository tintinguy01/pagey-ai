"use client";

import React from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/features/page-layout";
import { PageHeader } from "@/components/documentation/page-header";
import { SectionCard } from "@/components/documentation/section-card";
import { HelpCard } from "@/components/documentation/help-card";

// Documentation section data
const documentationSections = [
  {
    title: "Getting Started",
    description: "Learn the basics of using Pagey AI with your documents",
    link: "/documentation/getting-started"
  },
  {
    title: "Advanced Features",
    description: "Discover powerful features for document analysis and interaction",
    link: "/documentation/advanced-features"
  },
  {
    title: "API Reference",
    description: "Integrate Pagey AI into your applications with our API",
    link: "/documentation/api-reference"
  }
];

export default function DocumentationPage() {
  return (
    <PageLayout>
      <div className="pt-24 pb-16">
        <div className="container px-4 mx-auto">
          <PageHeader 
            title="Documentation" 
            description="Learn how to get the most out of Pagey AI" 
          />

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {documentationSections.map((section, index) => (
              <SectionCard 
                key={index}
                title={section.title}
                description={section.description}
                link={section.link}
                delayIndex={index}
              />
            ))}
          </motion.div>
          
          <HelpCard 
            title="Need Help?"
            description="If you can't find what you're looking for in our documentation, our support team is always ready to help."
            buttonText="Contact Support"
            buttonLink="/contact"
            className="mt-16"
          />
        </div>
      </div>
    </PageLayout>
  );
} 