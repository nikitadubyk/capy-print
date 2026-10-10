import { Button } from "@mantine/core";
import { Navigation } from "lucide-react";
import { homeLocation } from "@/config/home";

export const RouteButton = ({ className }: { className?: string }) => (
  <Button
    component="a"
    href={homeLocation.mapUrl}
    target="_blank"
    rel="noopener noreferrer"
    size="md"
    leftSection={<Navigation size={18} aria-hidden="true" />}
    fullWidth
    className={className}
  >
    Построить маршрут
  </Button>
);
