// Minimal structural type so the SDK doesn't take a hard dependency on `react`.
// Real React elements assignable to this; users who pass `react:` are expected to
// have `react` and `@react-email/render` installed (declared as optional peers).
export type ReactEmailElement = {
  readonly type: unknown
  readonly props: unknown
  readonly key: string | number | null
}

let renderPromise: Promise<(element: ReactEmailElement) => Promise<string>> | null = null

async function getRender(): Promise<(element: ReactEmailElement) => Promise<string>> {
  if (!renderPromise) {
    renderPromise = (async () => {
      try {
        const mod = (await import('@react-email/render')) as {
          render: (element: unknown, options?: { plainText?: boolean }) => Promise<string> | string
        }
        return (element: ReactEmailElement) => Promise.resolve(mod.render(element))
      } catch {
        throw new Error(
          'Passing `react:` requires `@react-email/render` and `react` to be installed. ' +
            'Run: npm install @react-email/render react',
        )
      }
    })()
  }
  return renderPromise
}

export async function renderReactEmail(element: ReactEmailElement): Promise<string> {
  const render = await getRender()
  return render(element)
}
