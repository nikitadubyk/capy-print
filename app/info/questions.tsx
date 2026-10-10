import { Accordion, Text, Title } from "@mantine/core";
import { FileText, PackageCheck } from "lucide-react";
import { faqGroups } from "@/config/faq";

const groupIcons = { order: FileText, pickup: PackageCheck };

export const InfoQuestions = () => (
  <section
    id="questions"
    className="mt-10 scroll-mt-6 space-y-8"
    aria-label="Частые вопросы"
  >
    {faqGroups.map(({ id, title, questions }) => {
      const Icon = groupIcons[id];
      return (
        <div key={id}>
          <div className="mb-4 flex items-center gap-3">
            <Icon
              size={24}
              className="shrink-0 text-capy-accent"
              aria-hidden="true"
            />
            <Title order={2}>{title}</Title>
          </div>
          <Accordion multiple variant="separated" radius="xl">
            {questions.map(({ id: questionId, question, answer }) => (
              <Accordion.Item key={questionId} value={questionId}>
                <Accordion.Control>{question}</Accordion.Control>
                <Accordion.Panel>
                  <Text c="dimmed" className="whitespace-pre-line">
                    {answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      );
    })}
  </section>
);
