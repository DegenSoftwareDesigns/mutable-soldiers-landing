"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TiltCardProps {
  children: React.ReactNode
  /** Maximum rotation toward the pointer in degrees. Default 12 */
  maxTilt?: number
  /** Invert the tilt so the card leans away from the pointer. Default false */
  tiltReverse?: boolean
  /** Scale applied while hovered. Default 1.02 */
  scale?: number
  /** CSS perspective distance in pixels. Default 1000 */
  perspective?: number
  /** Show the pointer-following glare highlight. Default true */
  glare?: boolean
  /** Color at the center of the glare gradient */
  glareColor?: string
  /** Classes for the outer perspective wrapper */
  containerClassName?: string
  /** Classes for the card surface */
  className?: string
  /** Remove the built-in neutral skin so consumers can provide their own surface */
  unstyled?: boolean
}

export interface TiltCardItemProps {
  children: React.ReactNode
  /** Lift toward the viewer in pixels while the card is hovered. Default 0 */
  depth?: number
  className?: string
  /** Semantic element used by the lifted layer. Default div */
  as?: "div" | "span"
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Spring used while the pointer is tracking across the card */
const TRACK_SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 0.6,
} as const
/** Softer spring so the card settles gently back to rest on pointer leave */
const RESET_SPRING = {
  type: "spring",
  stiffness: 140,
  damping: 18,
  mass: 1,
} as const
/** Normalized pointer position at rest (card center) */
const REST_POINT = 0.5
/** Subtle press-down while the card is clicked */
const PRESS_SCALE = 0.99
const INTERACTIVE_SELECTOR = 'button:not(:disabled), a[href], [role="button"]'

const TiltCardContext = createContext<{ hovered: boolean }>({ hovered: false })

// ─── Components ──────────────────────────────────────────────────────────────

export function TiltCard({
  children,
  maxTilt = 12,
  tiltReverse = false,
  scale = 1.02,
  perspective = 1000,
  glare = true,
  glareColor = "rgba(255, 255, 255, 0.35)",
  containerClassName,
  className,
  unstyled = false,
}: TiltCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const pointerPosition = useRef<{ x: number; y: number } | null>(null)
  const hoverInterval = useRef<number | null>(null)
  const activeInteractive = useRef<HTMLElement | null>(null)

  // Smoothed normalized pointer position; animated toward each pointer sample
  // with TRACK_SPRING and back to rest with the softer RESET_SPRING
  const tiltX = useMotionValue(REST_POINT)
  const tiltY = useMotionValue(REST_POINT)
  const cardScale = useSpring(1, TRACK_SPRING)

  const tiltSign = tiltReverse ? -1 : 1
  const rotateX = useTransform(
    tiltY,
    [0, 1],
    [maxTilt * tiltSign, -maxTilt * tiltSign],
  )
  const rotateY = useTransform(
    tiltX,
    [0, 1],
    [-maxTilt * tiltSign, maxTilt * tiltSign],
  )
  const glarePosX = useTransform(tiltX, (value) => value * 100)
  const glarePosY = useTransform(tiltY, (value) => value * 100)
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glarePosX}% ${glarePosY}%, ${glareColor}, transparent 65%)`

  const setInteractiveHover = useCallback((next: HTMLElement | null) => {
    if (activeInteractive.current === next) return
    activeInteractive.current?.removeAttribute("data-tilt-hovered")
    next?.setAttribute("data-tilt-hovered", "true")
    activeInteractive.current = next
  }, [])

  useEffect(() => {
    if (!hovered || shouldReduceMotion) {
      setInteractiveHover(null)
      return
    }

    const card = cardRef.current
    const interactives = card
      ? Array.from(card.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR))
      : []
    const syncHoverTarget = () => {
      const point = pointerPosition.current
      const interactive =
        point && card
          ? interactives.find((element) => {
              const rect = element.getBoundingClientRect()
              return (
                point.x >= rect.left &&
                point.x <= rect.right &&
                point.y >= rect.top &&
                point.y <= rect.bottom
              )
            }) ?? null
          : null
      setInteractiveHover(interactive)
    }

    syncHoverTarget()
    hoverInterval.current = window.setInterval(syncHoverTarget, 50)
    return () => {
      if (hoverInterval.current !== null) {
        window.clearInterval(hoverInterval.current)
        hoverInterval.current = null
      }
      setInteractiveHover(null)
    }
  }, [hovered, setInteractiveHover, shouldReduceMotion])

  // Stop any in-flight animations and hover tracking if the card unmounts.
  useEffect(
    () => () => {
      tiltX.stop()
      tiltY.stop()
      if (hoverInterval.current !== null) {
        window.clearInterval(hoverInterval.current)
      }
      activeInteractive.current?.removeAttribute("data-tilt-hovered")
    },
    [tiltX, tiltY],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || shouldReduceMotion) return
      pointerPosition.current = { x: event.clientX, y: event.clientY }
      const rect = event.currentTarget.getBoundingClientRect()
      animate(tiltX, (event.clientX - rect.left) / rect.width, TRACK_SPRING)
      animate(tiltY, (event.clientY - rect.top) / rect.height, TRACK_SPRING)
    },
    [tiltX, tiltY, shouldReduceMotion],
  )

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || shouldReduceMotion) return
      pointerPosition.current = { x: event.clientX, y: event.clientY }
      setHovered(true)
      cardScale.set(scale)
    },
    [cardScale, scale, shouldReduceMotion],
  )

  const handlePointerLeave = useCallback(() => {
    pointerPosition.current = null
    if (hoverInterval.current !== null) {
      window.clearInterval(hoverInterval.current)
      hoverInterval.current = null
    }
    setInteractiveHover(null)
    setHovered(false)
    cardScale.set(1)
    animate(tiltX, REST_POINT, RESET_SPRING)
    animate(tiltY, REST_POINT, RESET_SPRING)
  }, [cardScale, setInteractiveHover, tiltX, tiltY])

  const handlePointerDown = useCallback(() => {
    if (shouldReduceMotion) return
    cardScale.set(PRESS_SCALE)
  }, [cardScale, shouldReduceMotion])

  const handlePointerUp = useCallback(() => {
    cardScale.set(hovered ? scale : 1)
  }, [cardScale, hovered, scale])

  return (
    <div
      className={cn("relative", containerClassName)}
      style={{ perspective: `${perspective}px` }}
    >
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          scale: cardScale,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative will-change-transform",
          !unstyled &&
            "rounded-2xl border border-neutral-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_2px_4px_0px_rgba(0,0,0,0.04)]",
          !unstyled && "dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none",
          className,
        )}
      >
        <TiltCardContext.Provider value={{ hovered }}>
          <div
            style={{ transformStyle: "preserve-3d", borderRadius: "inherit" }}
          >
            {children}
          </div>
        </TiltCardContext.Provider>

        {glare && !shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ background: glareBackground, transform: "translateZ(1px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </motion.div>
    </div>
  )
}

export function TiltCardItem({
  children,
  depth = 0,
  className,
  as: Component = "div",
}: TiltCardItemProps) {
  const shouldReduceMotion = useReducedMotion()
  const { hovered } = useContext(TiltCardContext)
  const lifted = hovered && !shouldReduceMotion

  return (
    <Component
      className={cn(
        "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
        className,
      )}
      style={{
        transform: lifted ? `translateZ(${depth}px)` : "translateZ(0px)",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </Component>
  )
}
