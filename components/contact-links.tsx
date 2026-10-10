import { Button } from "@mantine/core";
import { ArrowUpRight } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { homeContacts } from "@/config/home";

export const ContactLinks = ({
  className,
  showArrow = false,
}: {
  className?: string;
  showArrow?: boolean;
}) => (
  <div className={twMerge("grid grid-cols-2 gap-3", className)}>
    {homeContacts.map(({ label, url }) => (
      <Button
        key={url}
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variant="default"
        size="sm"
        fullWidth
        rightSection={
          showArrow ? <ArrowUpRight size={16} aria-hidden="true" /> : undefined
        }
        className={twMerge("px-2", showArrow && "px-3")}
      >
        {label}
      </Button>
    ))}
  </div>
);
