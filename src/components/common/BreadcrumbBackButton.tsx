'use client'

import { useRouter } from 'next/navigation'

type BreadcrumbBackButtonProps = {
  label?: string
  fallbackHref?: string
  className?: string
}

export function BreadcrumbBackButton({
  label = 'Back',
  fallbackHref = '/',
  className,
}: BreadcrumbBackButtonProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
          return
        }

        router.push(fallbackHref)
      }}
      className={className}
    >
      {label}
    </button>
  )
}
