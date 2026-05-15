import type { ThreeElements } from "@react-three/fiber";

// Extend both the global and React-namespaced JSX interfaces
// This covers React 17 (global) and React 18/19 (React.JSX) runtimes
declare namespace JSX {
  interface IntrinsicElements extends ThreeElements {}
}

declare namespace React {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
