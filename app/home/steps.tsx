import { Text, Title } from "@mantine/core";

import { homeSteps } from "@/config/home";

export const HomeSteps = () => (
  <section className="mt-12 md:mt-16" aria-labelledby="steps-title">
    <Title id="steps-title" order={2}>
      От файла до бумаги.
    </Title>
    <ol className="mt-6 list-none p-0">
      {homeSteps.map(({ title, text }, index) => (
        <li
          key={title}
          className="flex gap-5 border-b border-capy-line py-5 first:pt-0"
        >
          <Text
            component="span"
            size="xl"
            fw={500}
            c="capyBlue"
            className="shrink-0"
          >
            {String(index + 1).padStart(2, "0")}
          </Text>
          <div>
            <Title order={3}>{title}</Title>
            <Text c="dimmed" className="mt-2">
              {text}
            </Text>
          </div>
        </li>
      ))}
    </ol>
  </section>
);
