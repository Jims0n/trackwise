"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#333",
          "--normal-text": "#f5f5f5",
          "--normal-border": "#444",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
