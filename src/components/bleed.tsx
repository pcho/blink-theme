import React, { ReactElement, ReactNode } from 'react'
import cn from 'clsx'

export function Bleed({
  full,
  children
}: {
  full: boolean
  children: ReactNode
}): ReactElement {
  return (
    <div
      className={cn(
        'bleed relative -mx-6 mt-6 md:-mx-8 2xl:-mx-24',
        full && [
          'md:mx:[calc(-50vw+50%+8rem)',
          'ltr:xl:ml-[calc(50%-50vw+16rem)] ltr:xl:mr-[calc(50%-50vw)]',
          'rtl:xl:ml-[calc(50%-50vw)] rtl:xl:mr-[calc(50%-50vw+16rem)]'
        ]
      )}
    >
      {children}
    </div>
  )
}
