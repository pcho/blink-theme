import React, { ReactElement } from 'react'
import { Anchor } from './anchor'
import cn from 'clsx'
import { ArrowRightIcon } from 'nextra/icons'
import { Item } from '../utils'

export function Breadcrumb({
  activePath
}: {
  activePath: Item[]
}): ReactElement {
  return (
    <div className="nextra-breadcrumb mt-2.5 flex gap-1 overflow-hidden text-sm text-gray-500 contrast-more:text-current">
      {activePath.map((item, index) => {
        const isLink = !item.children || item.withIndexPage
        const isActive = index === activePath.length - 1

        return (
          <React.Fragment key={item.route + item.name}>
            {index > 0 && <ArrowRightIcon className="w-3.5" />}
            <div
              className={cn(
                'transition-colors whitespace-nowrap',
                isActive
                  ? 'text-gray-600 dark:text-gray-400 contrast-more:font-bold contrast-more:text-current contrast-more:dark:text-current'
                  : [
                      'min-w-[24px] overflow-hidden text-ellipsis',
                      isLink && 'hover:text-gray-900 dark:hover:text-gray-200'
                    ]
              )}
              title={item.title}
            >
              {isLink && !isActive ? (
                <Anchor href={item.route}>{item.title}</Anchor>
              ) : (
                item.title
              )}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
