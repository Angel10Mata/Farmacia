"use client";

import React, { useState } from "react";

import { ServicesSection } from "@/components/(base)/(home)/services";
import { AboutSection } from "@/components/(base)/(home)/about";
import { ContactSection } from "@/components/(base)/(home)/contact";
import LoginForm from "@/components/(base)/(auth)/login/LogIn";

export default function Home() {
  return (
    <div className="bg-background text-foreground flex-1 flex flex-col">
      <LoginForm />
    </div>
  );
}
