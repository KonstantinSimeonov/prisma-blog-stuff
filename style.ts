import { CSSProperties } from "react";

const cap = (x: string) => `${x.slice(0, 1).toUpperCase()}${x.slice(1)}`

export const css = ([style]: TemplateStringsArray) => style.split(`;`).reduce<CSSProperties>((rules, x) => {
  const [name, value] = x.split(`:`).map(s => s.trim())
  const camel_name = name.split(`-`).map((c, i) => i > 0 ? cap(c) : c).join(``)
  return { ...rules, [camel_name]: value }
}, {})
