"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface NewsletterCardProps {
  title?: string;
  description?: string;
  delay?: number;
}

export function NewsletterCard({ 
  title = "Subscribe to our Newsletter", 
  description = "Get the latest Pagey AI updates, tips, and resources delivered to your inbox.",
  delay = 0.6
}: NewsletterCardProps) {
  const [email, setEmail] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the newsletter subscription
    console.log("Subscribing email:", email);
    // Reset the form
    setEmail("");
    // Show a success message or toast notification
  };

  return (
    <motion.div
      className="mt-16 bg-card/50 backdrop-blur-sm border border-border/50 p-8 rounded-xl max-w-4xl mx-auto text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>
      <p className="mb-6 text-muted-foreground">
        {description}
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-2 rounded-full bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <button 
          type="submit"
          className="px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Subscribe
        </button>
      </form>
    </motion.div>
  );
} 