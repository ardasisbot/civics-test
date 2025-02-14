import { Button } from "@/components/ui/button"
import Image from 'next/image'
import Link from 'next/link'
import { Toggles } from './Toggles'
import { Github } from 'lucide-react'
import { ModeToggle } from './mode-toggle'

export default function Header() {
  return (
    <>
      {/* Spacer div to prevent content from going under fixed header */}
      <div className="h-16" />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex-shrink-0 flex items-center gap-4">
              <Image
                src="/us_flag_icon.png"
                alt="US Flag"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
              <Link href="/" className="text-2xl font-bold whitespace-nowrap">
                U.S. Civics Practice Test
              </Link>
            </div>
            
            {/* Middle section */}
            <div className="flex-1 flex justify-center">
              <Toggles />
            </div>

            {/* Right section - fixed width to prevent shifts */}
            <div className="flex-shrink-0 hidden md:flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" className="w-[70px] justify-center">
                  <Link href="/about" className="text-sm font-medium">About</Link>
                </Button>
              </div>
              <div className="flex items-center gap-1 pl-2">
                <Button variant="ghost" size="icon" className="w-10 h-10" asChild>
                  <Link 
                    href="https://github.com/ardasisbot/civics-test" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="w-10 h-10 flex items-center justify-center">
                  <ModeToggle />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  )
} 