import { useEffect, useRef, useState } from "react"
import type { Page } from "../models"

export function useRemote<T>(key: string, loader: () => Promise<T>) {
  const load = useRef(loader)
  load.current = loader
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ key: string; value: T | null; loading: boolean; error: string }>(
    { key, value: null, loading: true, error: "" })
  useEffect(() => {
    let active = true
    setState(previous => ({ key, value: previous.key === key ? previous.value : null, loading: true, error: "" }))
    load.current().then(value => active && setState({ key, value, loading: false, error: "" }))
      .catch(error => active && setState(previous => ({ key, value: previous.key === key ? previous.value : null, loading: false, error: error instanceof Error ? error.message : "Unable to load this page." })))
    return () => { active = false }
  }, [key, revision])
  return { ...(state.key === key ? state : { value: null, loading: true, error: "" }), refresh: () => setRevision(value => value + 1) }
}

export function usePaged<T>(key: string, loader: (cursor?: string) => Promise<Page<T>>) {
  const [cursor, setCursor] = useState<{ key: string; value?: string }>({ key })
  const current = cursor.key === key ? cursor.value : undefined
  const page = useRemote(`${key}/${current || "first"}`, () => loader(current))
  const [accumulated, setAccumulated] = useState<{ key: string; items: T[] }>({ key, items: [] })
  useEffect(() => {
    if (!page.value) return
    setAccumulated(previous => ({ key, items: current && previous.key === key
      ? [...previous.items, ...page.value!.data] : page.value!.data }))
  }, [key, current, page.value])
  return { items: accumulated.key === key ? accumulated.items : [],
    loading: page.loading, error: page.error, retry: page.refresh,
    nextCursor: page.value?.nextCursor || null,
    refresh: () => { setCursor({ key }); page.refresh() },
    more: () => page.value?.nextCursor && setCursor({ key, value: page.value.nextCursor }) }
}
