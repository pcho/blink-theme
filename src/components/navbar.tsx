import React, { ReactElement, ReactNode } from 'react'
import cn from 'clsx'
import { useRouter } from 'next/router'
import { Menu, Transition } from '@headlessui/react'
import { ArrowRightIcon } from 'nextra/icons'

import { useConfig, useMenu } from '../contexts'
import { MatchSorterSearch } from './match-sorter-search'
import { Flexsearch } from './flexsearch'
import { GitHubIcon, DiscordIcon, MenuIcon } from 'nextra/icons'
import { Item, PageItem, MenuItem, renderComponent, getFSRoute } from '../utils'
import { Anchor } from './anchor'
import { DEFAULT_LOCALE } from '../constants'

interface NavBarProps {
  flatDirectories: Item[]
  items: (PageItem | MenuItem)[]
}

function NavbarMenu({
  className,
  menu,
  children
}: {
  className?: string
  menu: MenuItem
  children: ReactNode
}): ReactElement {
  const { items } = menu
  const routes = Object.fromEntries(
    (menu.children || []).map(route => [route.name, route])
  )

  return (
    <Menu>
      <Menu.Button
        className={cn(
          className,
          'items-center -ml-2 hidden whitespace-nowrap p-2 md:inline-flex',
          'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        )}
      >
        {children}
      </Menu.Button>
      <Transition
        leave="transition-opacity"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Menu.Items className="absolute right-0 z-20 mt-1 max-h-64 min-w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-white dark:ring-opacity-20">
          {Object.entries(items || {}).map(([key, item]) => {
            const href =
              item.href || routes[key]?.route || menu.route + '/' + key

            return (
              <Menu.Item key={key}>
                <Anchor
                  href={href}
                  className={cn(
                    'hidden whitespace-nowrap md:inline-block text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 relative select-none w-full',
                    'py-1.5 ltr:pl-3 ltr:pr-9 rtl:pr-3 rtl:pl-9'
                  )}
                  newWindow={item.newWindow}
                >
                  {item.title || key}
                </Anchor>
              </Menu.Item>
            )
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export function Navbar({ flatDirectories, items }: NavBarProps): ReactElement {
  const config = useConfig()
  const { locale = DEFAULT_LOCALE, asPath } = useRouter()
  const activeRoute = getFSRoute(asPath, locale)
  const { menu, setMenu } = useMenu()

  return (
    <div className="nextra-nav-container sticky top-0 z-20 w-full bg-transparent">
      <div className="nextra-nav-container-blur pointer-events-none absolute h-full w-full bg-white dark:bg-dark" />
      <nav className="mx-auto flex h-16 max-w-[90rem] items-center justify-end gap-2 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]">
        <Anchor
          href="/"
          className="flex ltr:mr-auto rtl:ml-auto items-center hover:opacity-75"
        >
          {renderComponent(config.logo)}
        </Anchor>

        {items.map(pageOrMenu => {
          if (pageOrMenu.hidden) return null

          if (pageOrMenu.type === 'menu') {
            const menu = pageOrMenu as MenuItem

            const isActive =
              menu.route === activeRoute ||
              activeRoute.startsWith(menu.route + '/')

            return (
              <div className="inline-block relative" key={'menu-' + menu.title}>
                <NavbarMenu
                  className={cn(
                    'nextra-nav-link flex gap-1',
                    isActive
                      ? 'active subpixel-antialiased'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                  menu={menu}
                >
                  {menu.title}
                  <ArrowRightIcon
                    height="1em"
                    className={cn(
                      'h-[18px] min-w-[18px] rounded-sm p-0.5',
                      '[&>path]:origin-center [&>path]:transition-transform [&>path]:rotate-90'
                    )}
                  />
                </NavbarMenu>
              </div>
            )
          }
          const page = pageOrMenu as PageItem
          let href = page.href || page.route || '#'

          // If it's a directory
          if (page.children) {
            href =
              (page.withIndexPage ? page.route : page.firstChildRoute) || href
          }

          const isActive =
            page.route === activeRoute ||
            activeRoute.startsWith(page.route + '/')

          return (
            <Anchor
              href={href}
              key={page.route}
              className={cn(
                'nextra-nav-link',
                '-ml-2 hidden whitespace-nowrap p-2 md:inline-block',
                !isActive || page.newWindow
                  ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  : 'active subpixel-antialiased'
              )}
              newWindow={page.newWindow}
              aria-selected={!page.newWindow && isActive}
            >
              {page.title}
            </Anchor>
          )
        })}

        <div className="hidden md:inline-block min-w-[200px]">
          {config.customSearch ||
            (config.search ? (
              config.unstable_flexsearch ? (
                <Flexsearch />
              ) : (
                <MatchSorterSearch directories={flatDirectories} />
              )
            ) : null)}
        </div>

        {config.projectLink || config.github ? (
          <Anchor
            className="p-2 text-current"
            href={config.projectLink || config.github}
            newWindow
          >
            {config.projectLinkIcon ? (
              renderComponent(config.projectLinkIcon)
            ) : (
              <>
                <GitHubIcon />
                <span className="sr-only">GitHub</span>
              </>
            )}
          </Anchor>
        ) : null}

        {config.projectChatLink ? (
          <Anchor
            className="p-2 text-current"
            href={config.projectChatLink}
            newWindow
          >
            {config.projectChatLinkIcon ? (
              renderComponent(config.projectChatLinkIcon)
            ) : (
              <>
                <DiscordIcon />
                <span className="sr-only">Discord</span>
              </>
            )}
          </Anchor>
        ) : null}

        <button
          className="nextra-menu-icon block p-2 -mr-2 md:hidden"
          onClick={() => setMenu(!menu)}
        >
          <MenuIcon className={cn({ open: menu })} />
        </button>
      </nav>
    </div>
  )
}
