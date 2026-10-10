import { Paper, Text, Title } from "@mantine/core";
import { FileText, Image as ImageIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { homeServices } from "@/config/home";

export const HomeServices = () => (
  <section aria-labelledby="about-title">
    <div className="mb-6 md:grid md:grid-cols-2 md:items-end md:gap-8">
      <Title id="about-title" order={2}>
        На бумаге
        <br />
        приятнее.
      </Title>
      <Text c="dimmed" className="mt-4 max-w-md md:mt-0">
        Capy Print — приложение нашего копицентра. Оформляйте печать здесь, а за
        готовым приходите к нам.
      </Text>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {homeServices.map(({ kind, title, text, formats }) => (
        <Paper
          key={kind}
          className={twMerge(
            "flex flex-col items-start rounded-3xl p-6 md:p-8",
            kind === "document" ? "bg-capy-blue" : "bg-capy-lilac"
          )}
        >
          <Title order={3}>{title}</Title>
          <Text className="mt-3">{text}</Text>
          {kind === "document" ? (
            <FileText
              size={64}
              strokeWidth={1}
              className="mt-6 mb-4 self-end rotate-9 opacity-70"
              aria-hidden="true"
            />
          ) : (
            <ImageIcon
              size={64}
              strokeWidth={1}
              className="mt-6 mb-4 self-end -rotate-10 opacity-70"
              aria-hidden="true"
            />
          )}
          <Text size="sm">{formats}</Text>
        </Paper>
      ))}
    </div>
  </section>
);
