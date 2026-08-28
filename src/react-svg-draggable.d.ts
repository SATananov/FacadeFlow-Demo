import 'react'

declare module 'react' {
  interface SVGAttributes<T> {
    draggable?: boolean
  }
}
