'use client'

import GlitchingFlag from '@/components/flagAnimation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <main className="">
        {/* Hero Section with GlitchingFlag */}
        <section className="flex flex-col items-center my-20">
          <div className="w-full mt-10 max-w-2xl mx-auto px-4 sm:px-0">
            <GlitchingFlag />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-center mt-10">Take the U.S. Civics Practice Test</h2>
          <h3 className="text-muted-foreground font-bold text-center text-balance max-w-2xl mx-auto px-4 text-pretty">
            The U.S. Civics Test is comprised of <a 
              href="https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-[#f45844] transition-colors"
            >
              100
            </a> questions. Test your knowledge now.
          </h3>
          <div className="flex gap-4 mt-8">
            <Button asChild>
              <Link href="/test?mode=sample&answerType=easy">Sample Test</Link>
            </Button>
            <Button asChild>
              <Link href="/test?mode=full&answerType=easy">Full Test</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
