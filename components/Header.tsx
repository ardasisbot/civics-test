"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Toggles } from "./Toggles";
import { Github, Menu, X } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className="h-14 sm:h-16" />

      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left section */}
            <div className="flex items-center gap-3">
              <Image
                src="/us_flag_icon.png"
                alt="US Flag"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
              <Link href="/" className="text-lg sm:text-2xl font-bold whitespace-nowrap">
                U.S. Civics Practice Test
              </Link>
            </div>

            {/* Middle section (hidden on mobile) */}
            <div className="hidden sm:flex flex-1 justify-center">
              <Toggles />
            </div>

            {/* Right section - Desktop buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button asChild variant="ghost" className="w-[70px] justify-center">
                <Link href="/about" className="text-sm font-medium">About</Link>
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10" asChild>
                <Link href="https://github.com/ardasisbot/civics-test" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                </Link>
              </Button>
              <ModeToggle />
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-background border-t shadow-md py-4">
            <div className="flex flex-col items-center gap-4">
              <Toggles />
              <Link href="/about" className="text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
              <Link
                href="https://github.com/ardasisbot/civics-test"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Github className="h-5 w-5" />
                GitHub
              </Link>
              <ModeToggle />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
