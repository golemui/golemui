/**
 * Throws when properties in widget.props collide with base widget props, which should never happen.
 *
 * @param widgetUid to describe which field has collisions
 * @param props widget.props
 * @param base widget props
 */
export function assertNoPropCollisions(
  widgetUid: string,
  props: Record<string, unknown> | undefined,
  base: Record<string, unknown>,
): void {
  const collisions = Object.keys(props ?? {}).filter((k) => k in base);
  if (collisions.length > 0) {
    throw new Error(
      `[GolemUI] Widget "${widgetUid}": prop keys [${collisions.join(', ')}] collide with widget fields`,
    );
  }
}
