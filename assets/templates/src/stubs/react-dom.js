// react-dom, identical except: when window.__filmInlinePortals is set,
// createPortal renders its children IN PLACE (real dialogs stay inside the
// film's transformed containers). scaffold.sh writes the absolute path below.
import * as RealDOM from "__REAL_REACT_DOM__";
export * from "__REAL_REACT_DOM__";

export function createPortal(children, container, key) {
  if (typeof window !== "undefined" && window.__filmInlinePortals) return children;
  return RealDOM.createPortal(children, container, key);
}

export default { ...RealDOM, createPortal };
