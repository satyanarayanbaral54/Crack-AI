"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const router = useRouter();

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    // Use replace to avoid the welcome screen appearing when hitting the back button
    router.replace("/login");
  };

  return showWelcome ? <WelcomeScreen onComplete={handleWelcomeComplete} /> : null;
}
