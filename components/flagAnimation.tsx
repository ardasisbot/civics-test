'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface Pixel {
  color: string
  opacity: number
  state: number
}

export default function GlitchingFlag() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<{
    animationFrameId?: number
    timeoutId?: NodeJS.Timeout
  }>({})
  const pathname = usePathname()

  useEffect(() => {
    let isMounted = true // Flag to check if the component is still mounted

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Cancel any existing animations
    if (animationRef.current.animationFrameId) {
      cancelAnimationFrame(animationRef.current.animationFrameId)
    }
    if (animationRef.current.timeoutId) {
      clearTimeout(animationRef.current.timeoutId)
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const image = new Image()
    image.src = '/us_flag.png'

    // Fixed parameters
    const pixelSize = 3
    const minInterval = 100
    const maxInterval = 200
    const opacityVariance = 0.6
    const stateChangeProbability = 0.01  
    const glitchCharacters = ["",  "-" ,"|", "*", "#"]

    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }

    const drawCharacter = (x: number, y: number, char: string, color: string) => {
      ctx.fillStyle = color
      ctx.font = `${pixelSize}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(char, x * pixelSize + pixelSize/2, y * pixelSize + pixelSize/2)
    }

    const handleImageLoad = () => {
      if (!isMounted) return

      // Reset canvas dimensions (this clears the context and its transforms)
      canvas.width = image.width * 2
      canvas.height = image.height * 2
      ctx.scale(2, 2)

      // Draw the image into a temporary canvas to extract pixel data
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
      if (!tempCtx) return

      tempCanvas.width = image.width
      tempCanvas.height = image.height
      tempCtx.drawImage(image, 0, 0)

      const pixelsWide = Math.floor(image.width / pixelSize)
      const pixelsHigh = Math.floor(image.height / pixelSize)

      // Initialize pixel array with default values
      const pixels: Pixel[][] = Array.from({ length: pixelsHigh }, () =>
        Array.from({ length: pixelsWide }, () => ({
          color: 'rgb(0, 0, 0)',
          opacity: 1,
          state: 0
        }))
      )

      // Fill the pixel array with data from the image
      for (let y = 0; y < pixelsHigh; y++) {
        for (let x = 0; x < pixelsWide; x++) {
          const imageData = tempCtx.getImageData(x * pixelSize, y * pixelSize, 1, 1).data
          pixels[y][x].color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`
        }
      }

      const animate = () => {
        if (!isMounted) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        for (let y = 0; y < pixelsHigh; y++) {
          for (let x = 0; x < pixelsWide; x++) {
            const pixel = pixels[y][x]
            if (Math.random() < stateChangeProbability) {
              pixel.state = Math.floor(Math.random() * glitchCharacters.length)
            }
            pixel.opacity = 1 - (Math.random() * opacityVariance)
            
            const [r, g, b] = pixel.color.match(/\d+/g)!.map(Number)
            const color = `rgba(${r}, ${g}, ${b}, ${pixel.opacity})`

            const char = glitchCharacters[pixel.state]
            if (char === "") {
              drawPixel(x, y, color)
            } else {
              drawCharacter(x, y, char, color)
            }
          }
        }

        const delay = Math.random() * (maxInterval - minInterval) + minInterval
        animationRef.current.timeoutId = setTimeout(() => {
          animationRef.current.animationFrameId = requestAnimationFrame(animate)
        }, delay)
      }

      animate()
    }

    // Assign the onload handler and also immediately call it if the image is cached
    image.onload = handleImageLoad
    if (image.complete) {
      handleImageLoad()
    }

    return () => {
      isMounted = false // Prevent further actions if unmounted
      if (animationRef.current.animationFrameId) {
        cancelAnimationFrame(animationRef.current.animationFrameId)
      }
      if (animationRef.current.timeoutId) {
        clearTimeout(animationRef.current.timeoutId)
      }
      animationRef.current = {}
      image.onload = null  // Remove the onload handler
    }
  }, [pathname]) // Or use [] if you want the animation to initialize only once

  return (
    <div className="flex justify-center items-center">
      <canvas ref={canvasRef} className="max-w-full h-auto" />
    </div>
  )
}
