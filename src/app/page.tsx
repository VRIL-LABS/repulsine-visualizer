"use client";

import { useRouter } from "next/navigation";
import { SaucerButton } from "@/components/SaucerButton/SaucerButton";

export default function Home() {
  const router = useRouter();

  return (
    <SaucerButton
      onEngage={() => router.push("/visualizer")}
    />
  );
}
