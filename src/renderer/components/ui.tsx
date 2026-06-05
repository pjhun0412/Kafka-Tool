import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({ variant = "secondary", size = "md", active = false, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, active && "active", className)}
    />
  );
}

export function IconButton({ className, ...props }: Omit<ButtonProps, "size">) {
  return <Button {...props} size="icon" className={className} />;
}
