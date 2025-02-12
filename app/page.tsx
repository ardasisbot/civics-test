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
          <div className="w-full mt-10 max-w-2xl mx-auto">
            <GlitchingFlag />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-center mt-10">Take the U.S Civics Test</h2>
          <h3 className="text-muted-foreground font-bold text-center text-balance max-w-2xl mx-auto px-4 text-pretty">
            U.S. Civics Test is comprised of 100 questions. Test your knowledge now.
          </h3>
          <div className="flex gap-4 mt-8">
            <Button asChild>
              <Link href="/test?mode=sample">Practice Test</Link>
            </Button>
            <Button asChild>
              <Link href="/test?mode=full">Full Test</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
