// Same curve as --ease-premium in globals.css — Motion doesn't read CSS
// custom properties, so components animating with Motion import this
// instead of duplicating the cubic-bezier array everywhere.
export const EASE_PREMIUM = [0.16, 1, 0.3, 1];
