'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface TestButtonProps {
  href: string
  children: React.ReactNode
}

export function TestButton({ href, children }: TestButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    localStorage.clear()
    router.push(href)
  }

  return (
    <Button onClick={handleClick}>
      {children}
    </Button>
  )
} 