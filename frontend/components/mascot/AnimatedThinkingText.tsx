import React, { useEffect, useState } from "react";
import styles from "./AnimatedThinkingText.module.css";

const messages = [
  "Pagey is reading documents...",
  "Pagey is thinking...",
  "Pagey is summarizing...",
  "Pagey is analyzing your question...",
  "Pagey is searching for answers..."
];

export const AnimatedThinkingText: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (typing) {
      if (displayed.length < messages[index].length) {
        timeout = setTimeout(() => {
          setDisplayed(messages[index].slice(0, displayed.length + 1));
        }, 40);
      } else {
        setTyping(false);
        timeout = setTimeout(() => {
          setTyping(true);
          setDisplayed("");
          setIndex((prev) => (prev + 1) % messages.length);
        }, 1200);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, typing, index]);

  return (
    <span className="italic text-muted-foreground transition-opacity duration-300 animate-pulse">
      {displayed}
      <span className={`inline-block w-2 h-5 align-bottom ${styles["animate-blink"]}`}>|</span>
    </span>
  );
}; 