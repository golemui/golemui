/**
 * Returns an IntersectionObserver and returns if isIntersecting in a callback
 * @param element element to check intersections
 * @param callback a function that returns a boolean value to know if the element is intersecting
 * @param options IntersectionObserver options
 */
export function createIntersectionObserver(
  element: Element,
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit,
): IntersectionObserver {
  if (!element) {
    throw new TypeError('The element provided to the IntersectionObserver must exist');
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      callback(entry.isIntersecting);
    });
  }, options);

  observer.observe(element);

  return observer;
}
