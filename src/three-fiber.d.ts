import type { ThreeElements } from "@react-three/fiber";

// Extend the global JSX namespace (React 17 classic transform)
declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Extend React.JSX (React 18/19 automatic transform with "jsx": "react-jsx")
declare module "react" {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}
