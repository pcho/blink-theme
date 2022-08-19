import { FC, ReactElement, ReactNode } from 'react'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { PageOpts } from 'nextra'

export interface DocsThemeConfig {
  components?: Record<string, FC>
  projectLink?: string
  github?: string
  projectLinkIcon?: ReactNode | FC
  docsRepositoryBase?: string
  // Can't be React component, otherwise will get Warning: A title element received an array with more than 1 element as children.
  titleSuffix?: string | (() => string)
  nextLinks?: boolean
  prevLinks?: boolean
  search?: boolean
  darkMode?: boolean
  nextThemes?: Pick<
    ThemeProviderProps,
    'defaultTheme' | 'storageKey' | 'forcedTheme'
  >
  defaultMenuCollapsed?: boolean
  font?: boolean
  footer?: boolean
  footerText?: ReactNode | FC
  footerEditLink?: ReactNode | FC
  logo?: ReactNode | FC
  head?: () => ReactElement,
  direction?: 'ltr' | 'rtl'
  i18n?: { locale: string; text: string; direction?: string }[]
  floatTOC?: boolean
  unstable_faviconGlyph?: string
  feedbackLink?: ReactNode | FC
  feedbackLabels?: string
  customSearch?: ReactNode | false
  // Can't be React component
  searchPlaceholder?: string | (() => string)
  projectChatLink?: string
  projectChatLinkIcon?: ReactNode | FC
  sidebarSubtitle?: ReactNode | FC<{ title: string }>
  banner?: ReactNode | FC
  bannerKey?: string
  gitTimestamp?: string | FC<{ timestamp: Date }>
  tocExtraContent?: ReactNode | FC
  unstable_searchResultEmpty?: ReactNode | FC
  notFoundLink?: ReactNode | FC
  notFoundLabels?: string
  serverSideErrorLink?: ReactNode | FC
  serverSideErrorLabels?: string
  bodyExtraContent?: ReactNode | FC
}

export type PageTheme = {
  navbar: boolean
  sidebar: boolean
  toc: boolean
  pagination: boolean
  footer: boolean
  layout: 'default' | 'full' | 'raw'
  typesetting: 'default' | 'article'
  breadcrumb: boolean
  timestamp: boolean
}

export type Context = {
  Content: FC
  pageOpts: PageOpts
  themeConfig: DocsThemeConfig
}

export type SearchResult = {
  id: string
  route: string
  prefix?: ReactNode
  children: ReactNode
}
