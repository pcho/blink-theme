import type { PageMapItem, PageOpts } from 'nextra'
import type { FC, ReactElement, ReactNode } from 'react'

import React, { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import 'focus-visible'
import scrollIntoView from 'scroll-into-view-if-needed'
import { SkipNavContent } from '@reach/skip-nav'
import cn from 'clsx'
import { MDXProvider } from '@mdx-js/react'

import './polyfill'
import {
  Head,
  Navbar,
  Footer,
  NavLinks,
  Sidebar,
  TOC,
  Breadcrumb,
  Banner
} from './components'
import { getComponents } from './mdx-components'
import {
  ActiveAnchorProvider,
  ConfigProvider,
  useConfig,
  useMenu
} from './contexts'
import { DEFAULT_LOCALE, IS_BROWSER } from './constants'
import { getFSRoute, normalizePages, renderComponent } from './utils'
import { Context, DocsThemeConfig, PageTheme } from './types'

let resizeObserver: ResizeObserver
if (IS_BROWSER) {
  resizeObserver ||= new ResizeObserver(entries => {
    if (location.hash) {
      const node = entries[0].target.ownerDocument.querySelector(location.hash)
      if (node) {
        scrollIntoView(node)
      }
    }
  })
}

function useDirectoryInfo(pageMap: PageMapItem[]) {
  const { locale = DEFAULT_LOCALE, defaultLocale, route } = useRouter()

  return useMemo(() => {
    // asPath can return redirected url
    const fsPath = getFSRoute(route, locale)
    return normalizePages({
      list: pageMap,
      locale,
      defaultLocale,
      route: fsPath
    })
  }, [pageMap, locale, defaultLocale, route])
}

interface BodyProps {
  themeContext: PageTheme
  breadcrumb: ReactNode
  timestamp?: number
  navigation: ReactNode
  children: ReactNode
}

const Body = ({
  themeContext,
  breadcrumb,
  timestamp,
  navigation,
  children
}: BodyProps): ReactElement => {
  const mainElement = useRef<HTMLElement>(null)
  const config = useConfig()
  const { locale = DEFAULT_LOCALE } = useRouter()

  useEffect(() => {
    if (mainElement.current) {
      resizeObserver.observe(mainElement.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  if (themeContext.layout === 'raw') {
    return <div className="w-full overflow-x-hidden">{children}</div>
  }

  const date =
    themeContext.timestamp && config.gitTimestamp && timestamp
      ? new Date(timestamp)
      : null

  const gitTimestampEl = date ? (
    <div className="pointer-default mt-12 mb-8 block ltr:text-right rtl:text-left text-xs text-gray-500 dark:text-gray-400">
      {typeof config.gitTimestamp === 'string'
        ? `${config.gitTimestamp} ${date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`
        : renderComponent(config.gitTimestamp, { timestamp: date })}
    </div>
  ) : (
    <div className="mt-16" />
  )

  const body = (
    <>
      {children}
      {gitTimestampEl}
      {navigation}
      {renderComponent(config.bodyExtraContent)}
    </>
  )

  if (themeContext.layout === 'full') {
    return (
      <article className="w-full justify-center overflow-x-hidden pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]">
        {body}
      </article>
    )
  }

  return (
    <article
      className={cn(
        'flex w-full min-w-0 max-w-full justify-center pb-8 pr-[calc(env(safe-area-inset-right)-1.5rem)]',
        themeContext.typesetting === 'article' &&
          'nextra-body-typesetting-article'
      )}
    >
      <main
        className="w-full min-w-0 max-w-4xl px-6 pt-4 md:px-8"
        ref={mainElement}
      >
        {breadcrumb}
        {body}
      </main>
    </article>
  )
}

const InnerLayout = ({
  filename,
  pageMap,
  meta,
  headings,
  timestamp,
  children
}: PageOpts & { children: ReactNode }): ReactElement => {
  const { route, locale = DEFAULT_LOCALE } = useRouter()
  const config = useConfig()
  const { menu } = useMenu()
  const {
    activeType,
    activeIndex,
    activeThemeContext,
    activePath,
    topLevelNavbarItems,
    docsDirectories,
    flatDirectories,
    flatDocsDirectories,
    directories
  } = useDirectoryInfo(pageMap)

  const localeConfig = config.i18n?.find(l => l.locale === locale)
  const isRTL = localeConfig
    ? localeConfig.direction === 'rtl'
    : config.direction === 'rtl'
  const direction = isRTL ? 'rtl' : 'ltr'
  useEffect(() => {
    if (typeof document === 'undefined') return
    // needs for `ltr:/rtl:` modifiers inside `styles.css` file
    document.documentElement.setAttribute('dir', direction)
  }, [])

  const filepath = route.slice(0, route.lastIndexOf('/') + 1)
  const themeContext = { ...activeThemeContext, ...meta }
  const hideSidebar = !themeContext.sidebar || themeContext.layout === 'raw'
  const asPopover = activeType === 'page' || hideSidebar

  const tocEl =
    activeType === 'page' ||
    !themeContext.toc ||
    themeContext.layout !== 'default' ? (
      themeContext.layout === 'full' || themeContext.layout === 'raw' ? null : (
        <div className="nextra-toc order-last hidden w-64 flex-shrink-0 px-4 text-sm xl:block" />
      )
    ) : (
      <TOC
        headings={config.floatTOC ? headings : []}
        filepathWithName={filepath + filename}
      />
    )

  return (
    <div
      dir={direction}
      className={cn('nextra-container main-container flex flex-col', {
        'menu-active': menu
      })}
    >
      <Head />
      <Banner />
      {themeContext.navbar ? (
        <Navbar flatDirectories={flatDirectories} items={topLevelNavbarItems} />
      ) : null}
      <div
        className={cn(
          'mx-auto flex w-full flex-1 items-stretch',
          themeContext.layout !== 'raw' && 'max-w-[90rem]'
        )}
      >
        <ActiveAnchorProvider>
          <Sidebar
            docsDirectories={docsDirectories}
            flatDirectories={flatDirectories}
            fullDirectories={directories}
            headings={headings}
            asPopover={asPopover}
            includePlaceholder={themeContext.layout === 'default'}
          />
          {tocEl}
          <SkipNavContent />
          <Body
            themeContext={themeContext}
            breadcrumb={
              activeType !== 'page' && themeContext.breadcrumb ? (
                <Breadcrumb activePath={activePath} />
              ) : null
            }
            timestamp={timestamp}
            navigation={
              activeType !== 'page' && themeContext.pagination ? (
                <NavLinks
                  flatDirectories={flatDocsDirectories}
                  currentIndex={activeIndex}
                />
              ) : null
            }
          >
            <MDXProvider
              components={getComponents({
                isRawLayout: themeContext.layout === 'raw',
                components: config.components
              })}
            >
              {children}
            </MDXProvider>
          </Body>
        </ActiveAnchorProvider>
      </div>
      {themeContext.footer && config.footer ? (
        <Footer menu={asPopover} />
      ) : null}
    </div>
  )
}

const nextraPageContext: Record<string, Context> = {}

function Layout(props: any): ReactElement {
  const { route } = useRouter()
  const context = nextraPageContext[route]

  if (!context) throw new Error(`No content found for ${route}.`)
  const { pageOpts, Content } = context
  return (
    <ConfigProvider value={context}>
      <InnerLayout {...pageOpts}>
        <Content {...props} />
      </InnerLayout>
    </ConfigProvider>
  )
}

// Make sure the same component is always returned so Next.js will render the
// stable layout. We then put the actual content into a global store and use
// the route to identify it.
export default function withLayout(
  route: string,
  Content: FC,
  pageOpts: PageOpts,
  themeConfig: DocsThemeConfig
) {
  nextraPageContext[route] = {
    Content,
    pageOpts,
    themeConfig
  }

  return Layout
}

export { useConfig, getComponents }
export { useTheme } from 'next-themes'
export * from './types'
export {
  Bleed,
  Callout,
  Collapse,
  NotFoundPage,
  ServerSideErrorPage,
  Tabs,
  Tab
} from './components'
