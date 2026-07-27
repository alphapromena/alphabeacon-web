import { Link } from 'react-router'

/** /dev/kitchen-sink — W1 fills this with every ab/ primitive in both themes. */
export function DevKitchenSinkScreen() {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-4 bg-background px-6 py-10 text-foreground">
      <h1 className="font-display text-2xl font-semibold">Kitchen sink</h1>
      <p className="text-sm text-muted-foreground">
        The ab/ component gallery is built in phase W1.
      </p>
      <Link className="text-sm underline underline-offset-4" to="/">
        ← App
      </Link>
    </div>
  )
}
