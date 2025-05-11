"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, HelpCircle } from "lucide-react";

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limitedFeatures: string[];
  cta: string;
  popular: boolean;
  recommended: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "yearly";
  isSelected: boolean;
  onClick: () => void;
}

export function PricingCard({ 
  plan, 
  billingCycle, 
  isSelected,
  onClick
}: PricingCardProps) {
  const getPlanPrice = () => {
    if (billingCycle === "monthly") {
      return plan.monthlyPrice;
    } else {
      return plan.yearlyPrice;
    }
  };
  
  const getMonthlySavings = () => {
    if (plan.name === "Free") return "0.00";
    const yearlyMonthlyEquivalent = plan.yearlyPrice / 12;
    return (plan.monthlyPrice - yearlyMonthlyEquivalent).toFixed(2);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      className={`relative rounded-xl cursor-pointer ${
        isSelected ? "ring-2 ring-primary shadow-lg" : "border border-border"
      } ${
        plan.popular ? "lg:scale-105 lg:-mt-4 lg:-mb-4 lg:shadow-xl z-10" : ""
      } bg-background overflow-hidden transition-all`}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      {/* Ribbon for recommended plan */}
      {plan.recommended && (
        <div className="absolute top-5 -right-12 w-40 transform rotate-45 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-bold uppercase text-center py-1 shadow-lg">
          Recommended
        </div>
      )}
      
      {plan.popular && (
        <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1.5">
          Most Popular
        </div>
      )}
      
      <div className="p-6 md:p-8">
        <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
        <p className="text-muted-foreground mt-1">{plan.description}</p>
        
        <div className="mt-6 mb-6">
          <span className="text-4xl font-bold text-foreground">
            ${getPlanPrice().toString().split(".")[0]}
          </span>
          <span className="text-xl font-bold text-foreground">
            {getPlanPrice().toString().split(".")[1] ? `.${getPlanPrice().toString().split(".")[1]}` : ""}
          </span>
          <span className="text-muted-foreground ml-2">
            / {billingCycle === "monthly" ? "month" : "year"}
          </span>
          
          {billingCycle === "yearly" && plan.name !== "Free" && (
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              Save ${getMonthlySavings()}/mo
            </div>
          )}
        </div>
        
        <Link href={plan.name === "Free" ? "/sign-up" : `/sign-up?plan=${plan.name.toLowerCase()}`}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3 rounded-full font-medium ${
              plan.name === "Free" 
                ? "bg-secondary hover:bg-secondary/80" 
                : `${plan.recommended ? "bg-gradient-to-r from-green-500 to-blue-500" : "bg-primary"} text-primary-foreground hover:opacity-90`
            }`}
          >
            {plan.cta}
          </motion.button>
        </Link>
        
        <div className="mt-8 space-y-3">
          <p className="font-medium">What&apos;s included:</p>
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
          
          {plan.limitedFeatures.length > 0 && (
            <>
              <div className="pt-3 border-t border-border mt-4" />
              {plan.limitedFeatures.map((feature) => (
                <div key={feature} className="flex items-start text-muted-foreground">
                  <HelpCircle className="h-5 w-5 mr-2 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
} 