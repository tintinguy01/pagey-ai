"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useUser } from "@clerk/nextjs";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "basic" | "pro">("basic");
  const { user } = useUser();
  const userId = user?.id;
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  const pricingPlans: Record<"free" | "basic" | "pro", {
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    limitedFeatures: string[];
    cta: string;
    popular: boolean;
    recommended: boolean;
  }> = {
    free: {
      name: "Free",
      description: "For casual users",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "5 PDF uploads per month",
        "Max 20 pages per PDF",
        "Basic AI responses",
        "Limited chat history (7 days)",
      ],
      limitedFeatures: [
        "No source citations",
        "Standard response speed",
        "No priority support",
      ],
      cta: "Get Started",
      popular: false,
      recommended: false,
    },
    basic: {
      name: "Basic",
      description: "For regular users",
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        "50 PDF uploads per month",
        "Max 100 pages per PDF",
        "Advanced AI responses",
        "Extended chat history (30 days)",
        "Source citations",
        "Faster response speed",
      ],
      limitedFeatures: [
        "No priority support",
      ],
      cta: "Start Free Trial",
      popular: true,
      recommended: true,
    },
    pro: {
      name: "Pro",
      description: "For power users",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        "Unlimited PDF uploads",
        "Unlimited pages per PDF",
        "Premium AI responses",
        "Unlimited chat history",
        "Enhanced source citations",
        "Fastest response speed",
        "Priority support",
        "Team sharing",
        "API access",
      ],
      limitedFeatures: [],
      cta: "Start Free Trial",
      popular: false,
      recommended: false,
    },
  };
  
  const yearlyDiscount = 15; // 15% discount for yearly billing
  
  const getPlanPrice = (plan: "free" | "basic" | "pro") => {
    const prices = pricingPlans[plan];
    if (billingCycle === "monthly") {
      return prices.monthlyPrice;
    } else {
      // Apply yearly discount
      return prices.yearlyPrice;
    }
  };
  
  const getMonthlySavings = (plan: "basic" | "pro") => {
    const prices = pricingPlans[plan];
    const yearlyMonthlyEquivalent = prices.yearlyPrice / 12;
    return (prices.monthlyPrice - yearlyMonthlyEquivalent).toFixed(2);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  async function handleUpgrade(plan: "basic" | "pro") {
    if (!userId) {
      alert("Please sign in to upgrade.");
      return;
    }
    setLoadingPlan(plan);
    const res = await fetch("/api/users/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, plan: plan.charAt(0).toUpperCase() + plan.slice(1) }),
    });
    const data = await res.json();
    setLoadingPlan(null);
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Failed to start checkout. Please try again.");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-gradient-to-b dark:from-[#0a192f] dark:to-[#112240]">
      <Navbar />
      <main className="flex py-12 md:py-20 justify-center text-foreground justify-items-center">
        <div className="container px-4">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl mx-auto mb-12 text-center"
          >
            <motion.h1 variants={item} className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Simple, transparent pricing
            </motion.h1>
            <motion.p variants={item} className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your needs. All plans include a 7-day free trial.
            </motion.p>
            
            {/* Billing Cycle Toggle */}
            <motion.div variants={item} className="mt-8 inline-flex items-center rounded-full border border-border p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  billingCycle === "monthly" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  billingCycle === "yearly" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly
                <span className="ml-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Save {yearlyDiscount}%
                </span>
              </button>
            </motion.div>
          </motion.div>
          
          {/* Pricing Cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {(["free", "basic", "pro"] as const).map((plan: "free" | "basic" | "pro") => (
              <motion.div
                key={plan}
                variants={item}
                className={`relative rounded-xl cursor-pointer ${
                  selectedPlan === plan 
                    ? "ring-2 ring-primary shadow-lg" 
                    : "border border-border"
                } ${
                  pricingPlans[plan].popular 
                    ? "lg:scale-105 lg:-mt-4 lg:-mb-4 lg:shadow-xl z-10" 
                    : ""
                } bg-background overflow-hidden transition-all`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPlan(plan)}
              >
                {/* Ribbon for recommended plan */}
                {pricingPlans[plan].recommended && (
                  <div className="absolute top-5 -right-12 w-40 transform rotate-45 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-bold uppercase text-center py-1 shadow-lg">
                    Recommended
                  </div>
                )}
                
                {pricingPlans[plan].popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1.5">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-bold text-foreground">{pricingPlans[plan].name}</h3>
                  <p className="text-muted-foreground mt-1">{pricingPlans[plan].description}</p>
                  
                  <div className="mt-6 mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      ${getPlanPrice(plan).toString().split(".")[0]}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {getPlanPrice(plan).toString().split(".")[1] ? `.${getPlanPrice(plan).toString().split(".")[1]}` : ""}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      / {billingCycle === "monthly" ? "month" : "year"}
                    </span>
                    
                    {billingCycle === "yearly" && plan !== "free" && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save ${getMonthlySavings(plan as "basic" | "pro")}/mo
                      </div>
                    )}
                  </div>
                  
                  {plan === "free" ? (
                    <Link href="/sign-up">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full py-3 rounded-full font-medium ${
                          plan === "free" 
                            ? "bg-secondary hover:bg-secondary/80 cursor-pointer" 
                            : `${pricingPlans[plan].recommended ? "bg-gradient-to-r from-green-500 to-blue-500" : "bg-primary"} text-primary-foreground hover:opacity-90`
                        }`}
                      >
                        {pricingPlans[plan].cta}
                      </motion.button>
                    </Link>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`cursor-pointer w-full py-3 rounded-full font-medium ${pricingPlans[plan].recommended ? "bg-gradient-to-r from-green-500 to-blue-500" : "bg-primary"} text-primary-foreground hover:opacity-90`}
                      onClick={(e) => { e.stopPropagation(); handleUpgrade(plan); }}
                      disabled={loadingPlan === plan || !userId}
                    >
                      {loadingPlan === plan ? "Redirecting..." : pricingPlans[plan].cta}
                    </motion.button>
                  )}
                  
                  <div className="mt-8 space-y-3">
                    <p className="font-medium">What&apos;s included:</p>
                    {pricingPlans[plan].features.map((feature) => (
                      <div key={feature} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    
                    {pricingPlans[plan].limitedFeatures.length > 0 && (
                      <>
                        <div className="pt-3 border-t border-border mt-4" />
                        {pricingPlans[plan].limitedFeatures.map((feature) => (
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
            ))}
          </div>
          
          {/* FAQ Section */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl mx-auto mt-24"
          >
            <motion.h2 variants={item} className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </motion.h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "Can I cancel my subscription anytime?",
                  answer: "Yes, you can cancel your subscription at any time. If you cancel, you will still have access to your plan until the end of your billing period."
                },
                {
                  question: "What happens after my free trial?",
                  answer: "After your 7-day free trial, you will be automatically billed for your selected plan. You can cancel anytime before the trial ends to avoid charges."
                },
                {
                  question: "Can I switch between plans?",
                  answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you will be given prorated credit for the remaining time on your current plan."
                },
                {
                  question: "Is there a limit to how many PDFs I can upload?",
                  answer: "The Free plan allows 5 PDFs per month, the Basic plan allows 50 PDFs per month, and the Pro plan offers unlimited PDF uploads."
                },
              ].map((faq, index) => (
                <motion.div 
                  key={index}
                  variants={item}
                  className="bg-secondary rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              variants={item}
              className="mt-12 text-center"
            >
              <p className="text-muted-foreground">
                Have more questions? <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 