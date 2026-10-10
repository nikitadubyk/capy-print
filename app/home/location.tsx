import { Text, Title } from "@mantine/core";
import { Banknote, FolderCheck, MapPin } from "lucide-react";
import { RouteButton } from "@/components/route-button";

import { homeLocation, homePickupDetails } from "@/config/home";

const pickupIcons = { status: FolderCheck, payment: Banknote };

export const HomeLocation = () => (
  <section
    className="mt-12 overflow-hidden rounded-3xl bg-white md:mt-16 md:grid md:grid-cols-2"
    aria-labelledby="location-title"
  >
    <div className="bg-capy-blue p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <Text variant="eyebrow">Забрать заказ</Text>
        <MapPin size={24} aria-hidden="true" />
      </div>
      <Title id="location-title" order={2}>
        Увидимся
        <br />
        {homeLocation.street}
      </Title>
      <Text component="address" fw={500} className="mt-4 not-italic">
        {homeLocation.area}
      </Text>
      <Text className="mt-2 max-w-md">{homeLocation.directions}</Text>
    </div>
    <div className="flex flex-col gap-5 border-t border-dashed border-capy-line p-6 md:border-t-0 md:border-l md:p-8">
      <Title order={3}>Перед получением</Title>
      <ul className="flex flex-col gap-4">
        {homePickupDetails.map(({ kind, title, text }) => {
          const Icon = pickupIcons[kind];
          return (
            <li key={kind} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-capy-blue text-capy-accent">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <Text fw={600}>{title}</Text>
                <Text size="sm" c="dimmed" className="mt-1">
                  {text}
                </Text>
              </div>
            </li>
          );
        })}
      </ul>
      <RouteButton className="mt-auto" />
      <Text size="sm" c="dimmed">
        {homeLocation.hoursNote}
      </Text>
    </div>
  </section>
);
