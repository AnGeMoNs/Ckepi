export type ParamIconName =
  | "gravity"
  | "atmosphere"
  | "radiation"
  | "temperature"
  | "slope"
  | "relief"
  | "water"
  | "solar"
  | "wind"
  | "soil"
  | "vegetation";

interface ParamIconProps {
  name: ParamIconName;
  className?: string;
}

/**
 * Cardboard parameter icon from the CKEPI V2 set (frontend/public/img/science-accessories).
 * Decorative: the value and its label are always written next to it.
 */
export function ParamIcon({ name, className = "h-10 w-10" }: ParamIconProps) {
  return (
    <img
      src={`/img/science-accessories/ckepi-icon-${name}.webp`}
      alt=""
      width={256}
      height={256}
      decoding="async"
      draggable={false}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  );
}
