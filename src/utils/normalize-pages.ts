import { PageMapItem } from 'nextra'
import getTitle from 'title'
import { DEFAULT_PAGE_THEME } from '../constants'
import { PageTheme } from '../types'

function extendMeta(
  meta: string | Record<string, any> = {},
  fallback: Record<string, any>
) {
  if (typeof meta === 'string') {
    meta = { title: meta }
  }
  const theme = Object.assign({}, fallback.theme, meta.theme)
  return Object.assign({}, fallback, meta, { theme })
}

export interface Item extends Omit<PageMapItem, 'children'> {
  title: string
  type: string
  children?: Item[]
  hidden?: boolean
  withIndexPage?: boolean
}

export interface PageItem extends Omit<PageMapItem, 'children'> {
  title: string
  type: string
  href?: string
  newWindow?: boolean
  children?: PageItem[]
  firstChildRoute?: string
  hidden?: boolean
  withIndexPage?: boolean
}

export interface MenuItem extends Omit<PageMapItem, 'children'> {
  title: string
  type: 'menu'
  hidden?: boolean
  children?: PageItem[]
  items?: Record<
    string,
    {
      title: string
      href?: string
      newWindow?: boolean
    }
  >
}

interface DocsItem extends Omit<PageMapItem, 'children'> {
  title: string
  type: string
  children?: DocsItem[]
  firstChildRoute?: string
  withIndexPage?: boolean
}

function findFirstRoute(items: DocsItem[]): string | undefined {
  for (const item of items) {
    if (item.route) return item.route
    if (item.children) {
      const route = findFirstRoute(item.children)
      if (route) return route
    }
  }
}

const CUSTOM_ERROR_PAGES = ['/404', '/500']

export function normalizePages({
  list,
  locale,
  defaultLocale,
  route,
  docsRoot = '',
  underCurrentDocsRoot = false,
  pageThemeContext = DEFAULT_PAGE_THEME
}: {
  list: PageMapItem[]
  locale: string
  defaultLocale?: string
  route: string
  docsRoot?: string
  underCurrentDocsRoot?: boolean
  pageThemeContext?: PageTheme
}) {
  let _meta: Record<string, any> | undefined
  for (let item of list) {
    if (item.name === 'meta.json') {
      if (locale === item.locale) {
        _meta = item.meta
        break
      }
      // fallback
      if (!_meta) {
        _meta = item.meta
      }
    }
  }
  const meta = _meta || {}
  const metaKeys = Object.keys(meta)

  for (let key of metaKeys) {
    if (typeof meta[key] === 'string') {
      meta[key] = {
        title: meta[key]
      }
    }
  }

  // All directories
  // - directories: all directories in the tree structure
  // - flatDirectories: all directories in the flat structure, used by search
  const directories: Item[] = []
  const flatDirectories: Item[] = []

  // Docs directories
  const docsDirectories: DocsItem[] = []
  const flatDocsDirectories: DocsItem[] = []

  // Page directories
  const topLevelNavbarItems: PageItem[] = []

  let activeType: string | undefined
  let activeIndex = 0
  let activeThemeContext = pageThemeContext
  let activePath: Item[] = []

  let metaKeyIndex = -1

  const fallbackMeta = meta['*'] || {}
  delete fallbackMeta.title
  delete fallbackMeta.href

  // Normalize items based on files and meta.json.
  const items = list
    .filter(
      a =>
        // not meta
        a.name !== 'meta.json' &&
        // not hidden routes
        !a.name.startsWith('_') &&
        // locale matches, or fallback to default locale
        (a.locale === locale || a.locale === defaultLocale || !a.locale)
    )
    .sort((a, b) => {
      const indexA = metaKeys.indexOf(a.name)
      const indexB = metaKeys.indexOf(b.name)
      if (indexA === -1 && indexB === -1) return a.name < b.name ? -1 : 1
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
    .flatMap(item => {
      const items = []
      const index = metaKeys.indexOf(item.name)
      let extendedItem
      if (index !== -1) {
        // Fill all skipped items in meta.
        for (let i = metaKeyIndex + 1; i < index; i++) {
          const key = metaKeys[i]
          if (key !== '*') {
            items.push({
              name: key,
              route: '',
              ...meta[key]
            })
          }
        }
        metaKeyIndex = index
        extendedItem = { ...meta[item.name], ...item }
      }
      items.push(extendedItem || item)
      return items
    })

  // Fill all skipped items in meta.
  for (let i = metaKeyIndex + 1; i < metaKeys.length; i++) {
    const key = metaKeys[i]
    if (key !== '*') {
      items.push({
        name: key,
        route: '#',
        ...meta[key]
      })
    }
  }

  for (let i = 0; i < items.length; i++) {
    const a = items[i]

    // If there are two items with the same name, they must be a directory and a
    // page. In that case we merge them, and use the page's link.
    if (i + 1 < items.length && a.name === items[i + 1].name) {
      items[i + 1] = { ...items[i + 1], withIndexPage: true }
      if (a.children && !items[i + 1].children) {
        items[i + 1].children = a.children
      }
      continue
    }

    // Get the item's meta information.
    const extendedMeta = extendMeta(meta[a.name], fallbackMeta)
    const { title, hidden, type = 'doc' } = extendedMeta
    const extendedPageThemeContext = {
      ...pageThemeContext,
      ...extendedMeta.theme
    }
    // If the doc is under the active page root.
    const isCurrentDocsTree = route.startsWith(docsRoot)

    const normalizedChildren: any =
      a.children &&
      normalizePages({
        list: a.children,
        locale,
        defaultLocale,
        route,
        docsRoot: type === 'page' || type === 'menu' ? a.route : docsRoot,
        underCurrentDocsRoot: underCurrentDocsRoot || isCurrentDocsTree,
        pageThemeContext: extendedPageThemeContext
      })

    const getItem = (): Item => ({
      ...a,
      type,
      title: title || (type === 'separator' ? undefined : getTitle(a.name)),
      ...(hidden && { hidden }),
      ...(normalizedChildren && { children: [] })
    })
    const item: Item = getItem()
    const docsItem: DocsItem = getItem()
    const pageItem: PageItem = getItem()

    // This item is currently active, we collect the active path etc.
    if (a.route === route) {
      activePath = [item]
      activeType = type
      // There can be multiple matches.
      activeThemeContext = {
        ...activeThemeContext,
        ...extendedPageThemeContext
      }
      switch (type) {
        case 'page':
        case 'menu':
          // Active on the navbar
          activeIndex = topLevelNavbarItems.length
          break
        case 'doc':
          // Active in the docs tree
          if (isCurrentDocsTree) {
            activeIndex = flatDocsDirectories.length
          }
      }
    }
    if (hidden || CUSTOM_ERROR_PAGES.includes(a.route)) continue

    if (normalizedChildren) {
      if (
        normalizedChildren.activeIndex !== undefined &&
        normalizedChildren.activeType !== undefined
      ) {
        activeThemeContext = normalizedChildren.activeThemeContext
        activeType = normalizedChildren.activeType
        activePath = [item, ...normalizedChildren.activePath]
        switch (activeType) {
          case 'page':
          case 'menu':
            activeIndex =
              topLevelNavbarItems.length + normalizedChildren.activeIndex
            break
          case 'doc':
            activeIndex =
              flatDocsDirectories.length + normalizedChildren.activeIndex
            break
        }
        if (a.withIndexPage) {
          if (type === 'doc') {
            activeIndex++
          }
        }
      }

      switch (type) {
        case 'page':
        case 'menu':
          // @ts-expect-error normalizedChildren === true
          pageItem.children.push(...normalizedChildren.directories)
          docsDirectories.push(...normalizedChildren.docsDirectories)

          // If it's a page with children inside, we inject itself as a page too.
          if (normalizedChildren.flatDirectories.length) {
            pageItem.firstChildRoute = findFirstRoute(
              normalizedChildren.flatDirectories
            )
            topLevelNavbarItems.push(pageItem)
          } else if (pageItem.withIndexPage) {
            topLevelNavbarItems.push(pageItem)
          }

          break
        case 'doc':
          if (isCurrentDocsTree) {
            if (Array.isArray(docsItem.children)) {
              docsItem.children.push(...normalizedChildren.docsDirectories)
            }
            // Itself is a doc page.
            if (item.withIndexPage) {
              flatDocsDirectories.push(docsItem)
            }
          }
      }

      flatDirectories.push(...normalizedChildren.flatDirectories)
      flatDocsDirectories.push(...normalizedChildren.flatDocsDirectories)
      if (Array.isArray(item.children)) {
        item.children.push(...normalizedChildren.directories)
      }
    } else {
      flatDirectories.push(item)
      switch (type) {
        case 'page':
        case 'menu':
          topLevelNavbarItems.push(pageItem)
          break
        case 'doc':
          if (isCurrentDocsTree) {
            flatDocsDirectories.push(docsItem)
          }
      }
    }

    directories.push(item)
    switch (type) {
      case 'page':
      case 'menu':
        if (isCurrentDocsTree && underCurrentDocsRoot) {
          docsDirectories.push(pageItem)
        }
        break
      case 'doc':
      case 'separator':
        if (isCurrentDocsTree) {
          docsDirectories.push(docsItem)
        }
    }
  }

  return {
    activeType,
    activeIndex,
    activeThemeContext,
    activePath,
    directories,
    flatDirectories,
    docsDirectories,
    flatDocsDirectories,
    topLevelNavbarItems
  }
}
