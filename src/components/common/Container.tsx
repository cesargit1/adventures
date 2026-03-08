import React from 'react'

export function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const baseClassName = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
  const mergedClassName = className ? `${baseClassName} ${className}` : baseClassName

  return <div className={mergedClassName}>{children}</div>
}
